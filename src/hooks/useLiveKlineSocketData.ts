import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URLS, ENV } from "../services/http/apiClient";

const HEARTBEAT_INTERVAL = 30 * 1000; // 心跳包每30秒一次
const MAX_RECONNECT_ATTEMPTS = 5; // 最多自动重连5次
const RECONNECT_DELAY = 2000; // 重连延迟2秒

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useLiveKlineSocketData(address: string, enabled: boolean) {
  const SOCKET_URL = SOCKET_URLS[ENV].SOCKET_URL;
  const SOCKET_PATH = SOCKET_URLS[ENV].SOCKET_PATH;
  
  const socketRef = useRef<Socket | null>(null);
  const heartBeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const [rawData, setRawData] = useState<number[][]>([]);
  const [priceUSD, setPriceUSD] = useState<string>('');
  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // 清理定时器
  const cleanupTimers = useCallback(() => {
    if (heartBeatTimerRef.current) {
      clearInterval(heartBeatTimerRef.current);
      heartBeatTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // 启动心跳包
  const startHeartbeat = useCallback((socket: Socket) => {
    cleanupTimers();
    heartBeatTimerRef.current = setInterval(() => {
      if (socket.connected) {
        console.log("🛎️ 心跳：发送 SUBSCRIBE");
        socket.emit("message", JSON.stringify({ type: "SUBSCRIBE", address }));
      }
    }, HEARTBEAT_INTERVAL);
  }, [address, cleanupTimers]);

  // 重连逻辑
  const tryReconnect = useCallback(() => {
    if (!isMountedRef.current || reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error("⛔ 已达到最大重连次数或组件已卸载，停止重连");
      setSocketState(prev => ({ ...prev, isConnecting: false, error: "Max reconnection attempts reached" }));
      return;
    }

    reconnectAttemptsRef.current += 1;
    console.log(`🔄 尝试重连 (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

    setSocketState(prev => ({ ...prev, isConnecting: true }));

    reconnectTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connectSocket();
      }
    }, RECONNECT_DELAY);
  }, []);

  // 连接 socket
  const connectSocket = useCallback(() => {
    if (!enabled || !address || !isMountedRef.current) return;

    console.log("🚀 正在尝试连接 socket...");
    setSocketState(prev => ({ ...prev, isConnecting: true, error: null }));

    const socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      reconnection: false, // 禁用内置自动重连，自己控制
      timeout: 10000, // 10秒超时
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!isMountedRef.current) return;
      
      console.log("✅ socket 连接成功！");
      setSocketState({
        isConnected: true,
        isConnecting: false,
        error: null,
      });
      reconnectAttemptsRef.current = 0; // 重置重连次数
      
      socket.emit("message", JSON.stringify({ type: "SUBSCRIBE", address }));
      startHeartbeat(socket);
    });

    socket.on("PRICE_DATA", (msg: any) => {
      if (!isMountedRef.current) return;
      
      if (msg?.address !== address) {
        return; // 如果地址不对，直接忽略
      }

      // 验证 ohlcvs 数据格式
      if (!Array.isArray(msg.ohlcvs) || msg.ohlcvs.length !== 6) {
        console.warn("收到的 ohlcvs 数据格式异常:", msg.ohlcvs);
        return;
      }

      // 验证所有元素都是数字
      const isValidData = msg.ohlcvs.every((item: any) => typeof item === 'number' && !isNaN(item));
      if (!isValidData) {
        console.warn("收到的 ohlcvs 数据包含非数字值:", msg.ohlcvs);
        return;
      }

      // 只在数据真正变化时记录和更新状态
      const currentData = JSON.stringify(msg.ohlcvs);
      const currentPrice = msg.priceUSD || '';
      
      // 使用 ref 来获取最新值，避免依赖项问题
      if (currentData !== JSON.stringify(rawData[0]) || currentPrice !== priceUSD) {
        console.log("📥 收到新的 K线数据:", msg.ohlcvs);
        setRawData([msg.ohlcvs]);
        setPriceUSD(currentPrice);
      }
    });

    socket.on("disconnect", (reason: string) => {
      if (!isMountedRef.current) return;
      
      console.warn("⚡️ socket 断开连接！", reason);
      setSocketState(prev => ({ ...prev, isConnected: false }));
      cleanupTimers();
      
      if (reason === 'io server disconnect') {
        // 服务器主动断开，不重连
        setSocketState(prev => ({ ...prev, error: "Server disconnected" }));
      } else {
        // 网络问题，尝试重连
        tryReconnect();
      }
    });

    socket.on("connect_error", (error: any) => {
      if (!isMountedRef.current) return;
      
      console.error("❌ socket 连接出错:", error);
      setSocketState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error.message || "Connection failed" 
      }));
      cleanupTimers();
      tryReconnect();
    });

    socket.on("error", (error: any) => {
      if (!isMountedRef.current) return;
      
      console.error("❌ socket 错误:", error);
      setSocketState(prev => ({ 
        ...prev, 
        error: error.message || "Socket error" 
      }));
    });
  }, [enabled, address, SOCKET_URL, SOCKET_PATH, startHeartbeat, cleanupTimers, tryReconnect]);

  // 断开连接
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      console.log("🧹 清理 socket...");
      socketRef.current.emit("message", JSON.stringify({ type: "UNSUBSCRIBE", address }));
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    cleanupTimers();
    setSocketState({
      isConnected: false,
      isConnecting: false,
      error: null,
    });
    // 清空数据
    setRawData([]);
    setPriceUSD('');
  }, [address, cleanupTimers]);

  // 主 effect - 优化依赖项，避免不必要的重新连接
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!enabled || !address) {
      disconnectSocket();
      return;
    }

    connectSocket();

    return () => {
      isMountedRef.current = false;
      disconnectSocket();
    };
  }, [address, enabled, connectSocket, disconnectSocket]);

  // 优化的数据返回 - 使用 useMemo 避免不必要的数组创建
  const ohlcvs = useMemo(() => [...rawData], [rawData]);

  return {
    priceUSD,
    ohlcvs,
    isLoading: socketState.isConnecting,
    isConnected: socketState.isConnected,
    error: socketState.error,
  };
}