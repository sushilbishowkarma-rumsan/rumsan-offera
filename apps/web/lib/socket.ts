// rumsan-offera/apps/web/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function isAudioUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).__audioUnlocked;
}

export function getSocket(token: string): Socket {
  if (!token) {
    throw new Error('[Socket] getSocket called with empty token');
  }

  if (!socket) {
    socket = io(
      `${process.env.NEXT_PUBLIC_SERVER_API ?? 'http://localhost:4000'}/notifications`,
      {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
      },
    );

    socket.on('connect_error', () => {
      // Silently handle — socket will auto-reconnect
    });
  }

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// // rumsan-offera/apps/web/lib/socket.ts
// import { io, Socket } from 'socket.io-client';

// let socket: Socket | null = null;
// let currentToken: string | null = null;
// let _audioUnlocked = false;
// let _listenersRegistered = false;

// function _attemptUnlock() {
//   if (_audioUnlocked) return;
//    if ((window as any).__audioUnlocked) {
//     _audioUnlocked = true;
//     return;
//   }
//   const audio = new Audio('/sounds/notification.mp3');
//   audio.volume = 0;
//   audio
//     .play()
//     .then(() => {
//       audio.pause();
//       audio.currentTime = 0;
//       _audioUnlocked = true;
//       // Clean up — no longer needed
//       window.removeEventListener('click', _attemptUnlock);
//       window.removeEventListener('keydown', _attemptUnlock);
//       window.removeEventListener('touchstart', _attemptUnlock);
//     })
//     .catch(() => {
//       // Still blocked — will retry on the next interaction
//     });
// }

// function _registerUnlockListeners() {
//   if (_listenersRegistered || typeof window === 'undefined') return;
//   _listenersRegistered = true;
//   window.addEventListener('click', _attemptUnlock);
//   window.addEventListener('keydown', _attemptUnlock);
//   window.addEventListener('touchstart', _attemptUnlock); // mobile support
// }

//  if (typeof window !== 'undefined') {
//   _registerUnlockListeners();
// }

// export function getSocket(token: string): Socket {
//   if (!token) {
//     throw new Error('[Socket] getSocket called with empty token');
//   }

//   if (!socket) {
//     currentToken = token;
//     socket = io(
//       `${process.env.NEXT_PUBLIC_SERVER_API ?? 'http://localhost:4000'}/notifications`,
//       {
//         auth: { token },
//         transports: ['websocket'],
//         autoConnect: true,
//       },
//     );

//     socket.on('connect_error', () => {
//       // Silently handle connection errors — socket will auto-reconnect
//     });

    
//   }

//   return socket;
// }
// export function isAudioUnlocked(): boolean {
//   return _audioUnlocked || !!(window as any).__audioUnlocked;
// }

// /** Tear down (call on logout) */
// export function disconnectSocket() {
//   socket?.disconnect();
//   socket = null;
//   currentToken = null;
//   _audioUnlocked = false;
//   _listenersRegistered = false;
//   if (typeof window !== 'undefined') {
//     window.removeEventListener('click', _attemptUnlock);
//     window.removeEventListener('keydown', _attemptUnlock);
//     window.removeEventListener('touchstart', _attemptUnlock);
//   }
// }