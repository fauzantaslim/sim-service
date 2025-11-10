import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket
} from '@whiskeysockets/baileys';
import logger from './logger';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';

let sock: WASocket;

/**
 * Menghubungkan ke WhatsApp dan menangani event koneksi.
 */
export async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  sock = makeWASocket({
    auth: state,
    logger: logger // Cast to any to match Baileys logger type
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      logger.error(
        `Connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`
      );
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      logger.info('WhatsApp client connected');
    }

    if (qr) {
      logger.info('QR code received, please scan');
      qrcode.generate(qr, { small: true });
    }
  });
}

/**
 * Mengirimkan pesan OTP ke nomor WhatsApp.
 */
export async function sendWhatsAppOTP(
  phoneNumber: string,
  otp: string
): Promise<void> {
  if (!sock) {
    logger.warn('WhatsApp client is not connected, unable to send OTP.');
    return;
  }

  // Format nomor telepon ke format WhatsApp (contoh: 6281234567890@s.whatsapp.net)
  const formattedNumber = `${phoneNumber.replace(/^0/, '62')}@s.whatsapp.net`;

  try {
    await sock.sendMessage(formattedNumber, {
      text: `[SIM Service] Kode OTP Anda adalah: *${otp}*. Jangan bagikan kode ini kepada siapa pun.`
    });
    logger.info(`Successfully sent OTP to ${formattedNumber}`);
  } catch (error) {
    logger.error({
      message: `Failed to send OTP to ${formattedNumber}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
