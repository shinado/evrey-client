import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { PaymentMethod, paymentMethods } from '../constants/PaymentMethods';
import { moonpayService } from '../services/moonpay';
import BottomSheet from './BottomSheet';

type PaymentMethodSelectorProps = {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod;
};

// 添加 IP 信息类型
type IpInfo = {
  isAllowed: boolean;
  alpha2: string;
};

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  isVisible,
  onClose,
  onSelect,
  selectedMethod
}) => {
  const [ipInfo, setIpInfo] = useState<IpInfo | null>(null);

  useEffect(() => {
    const getIpInfo = async () => {
      const info = await moonpayService.getIpAddressInfo();
      console.log('IP Info:', info);
      setIpInfo(info);
    };
    
    getIpInfo();
  }, []);

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      height="auto"
    >
      <View>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.type}
            style={[
              styles.method,
              //(method.type !== 'crypto' && !ipInfo?.isAllowed) && styles.methodDisabled,
              method.type !== 'crypto' && styles.methodDisabled,
              selectedMethod?.type === method.type && styles.selectedItem
            ]}
            onPress={() => {
              onSelect(method);
              onClose();
            }}
            //disabled={method.type !== 'crypto' && !ipInfo?.isAllowed}
            disabled={method.type !== 'crypto'}
          >
            <View style={styles.methodLeft}>
              <Ionicons name={method.icon} size={24} color="#000" />
              <Text style={styles.methodText}>{method.name}</Text>
            </View>
            {/*{method.type !== 'crypto' && !ipInfo?.isAllowed && (
              <Text style={styles.methodStatus}>
                Coming soon to {ipInfo?.alpha2 || 'your region'}
              </Text>
            )}*/}
            {method.type !== 'crypto' && (
              <Text style={styles.methodStatus}>
                Coming soon
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  methodDisabled: {
    opacity: 0.5,
  },
  methodStatus: {
    fontSize: 14,
    color: '#666',
  },
  selectedItem: {
    backgroundColor: '#f8f9fb',
    borderRadius: 12,
    padding: 12,
  }
});

export default PaymentMethodSelector; 