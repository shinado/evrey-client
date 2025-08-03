import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Polyfill Buffer
global.Buffer = Buffer;
global.TextEncoder = require('text-encoding').TextEncoder;

// If you need crypto, use the native crypto API
// if (typeof global.crypto !== 'object') {
//     global.crypto = {
//         //@ts-ignore
//         getRandomValues: function(byteArray: Uint8Array): Uint8Array {
//             for (let i = 0; i < byteArray.length; i++) {
//                 byteArray[i] = Math.floor(Math.random() * 256);
//             }
//             return byteArray;
//         }
//     };
//   }