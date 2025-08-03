import { create } from "zustand";

type MyState = {
  privateKey: string;
  setPrivateKey: (key: string) => void;
  publicKey: string;
  setPublicKey: (key: string) => void;
  decryptedData: string;
  setDecryptedData: (data: string) => void;
  bottomTabBarHeight: number;
  setBottomTabBarHeight: (height: number) => void;
  videoTabIndex: number;
  setVideoTabIndex: (index: number) => void;
};
export const useMyStore = create<MyState>((set) => ({
  decryptedData: "",
  setDecryptedData: (data: string) => set({ decryptedData: data }),
  privateKey: "",
  setPrivateKey: (key: string) => set({ privateKey: key }),
  publicKey: "",
  setPublicKey: (key: string) => set({ publicKey: key }),
  bottomTabBarHeight: 0,
  setBottomTabBarHeight: (height: number) => set({ bottomTabBarHeight: height }),
  videoTabIndex: 0,
  setVideoTabIndex: (index: number) => set({ videoTabIndex: index }),
}));
