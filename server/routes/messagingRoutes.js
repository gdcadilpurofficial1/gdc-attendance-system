import express from 'express';
import SystemConfig from '../models/SystemConfig.js';
import MessageLog from '../models/MessageLog.js';
import messagingQueue from '../services/messagingQueue.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  getLatestWhatsAppQr,
  unlinkWhatsAppDevice,
  isWhatsAppConnected,
} from '../services/whatsappService.js';

const router = express.Router();

// @route   GET /api/messaging/status (Admin - Live Queue Status)
router.get('/status', protect, async (req, res, next) => {
  try {
    const queueStatus = messagingQueue.getStatus();
    const config = (await SystemConfig.findOne()) || (await SystemConfig.create({}));

    // Auto-migrate legacy Urdu template to standard Sindhi format
    const SINDHI_DEFAULT_TEMPLATE =
      'محترم {FATHER_NAME}، {RELATION} {STUDENT_NAME}، رول نمبر {ROLL_NO}، ڪلاس {CLASS_NAME} اڄ {DATE} گورنمينٽ ڊگري ڪاليج عادلپور مان غير حاضر (غير حاضر) آهي. مھرباني ڪري حاضري کي يقيني بڻايو. پرنسپال، جي ڊي سي عادلپور.';

    if (!config.messageTemplate || config.messageTemplate.includes('Mohtaram')) {
      config.messageTemplate = SINDHI_DEFAULT_TEMPLATE;
      await config.save();
    }

    // Today's total sent / failed count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await MessageLog.countDocuments({ status: 'SENT', createdAt: { $gte: today } });
    const failedToday = await MessageLog.countDocuments({ status: 'FAILED', createdAt: { $gte: today } });
    const isConnected = isWhatsAppConnected();

    res.json({
      success: true,
      queue: queueStatus,
      config: {
        autoSendOnSubmit: config.autoSendOnSubmit,
        dispatchIntervalSeconds: config.dispatchIntervalSeconds,
        defaultChannel: config.defaultChannel,
        whatsappLinked: Boolean(config.whatsappLinked || isConnected),
        whatsappPhone: config.whatsappPhone,
        smsGatewayApiKey: config.smsGatewayApiKey,
        messageTemplate: config.messageTemplate,
      },
      stats: {
        sentToday,
        failedToday,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/messaging/config (Admin only - Update settings)
router.put('/config', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) config = new SystemConfig();

    const allowed = ['autoSendOnSubmit', 'dispatchIntervalSeconds', 'defaultChannel', 'messageTemplate'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) config[key] = req.body[key];
    }

    await config.save();
    res.json({ success: true, message: 'Messaging configuration updated successfully', config });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/messaging/logs
router.get('/logs', protect, async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const logs = await MessageLog.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messaging/retry-failed (Admin only - Re-queue failed messages after connecting gateway)
router.post('/retry-failed', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const failedLogs = await MessageLog.find({
      status: 'FAILED',
      createdAt: { $gte: today },
    });

    if (failedLogs.length === 0) {
      return res.json({ success: true, count: 0, message: 'No failed messages found for today.' });
    }

    for (const log of failedLogs) {
      log.status = 'QUEUED';
      log.errorMessage = '';
      await log.save();
      messagingQueue.queue.push(log._id.toString());
    }

    if (!messagingQueue.isProcessing) {
      messagingQueue.processQueue();
    }

    res.json({
      success: true,
      count: failedLogs.length,
      message: `Successfully re-queued ${failedLogs.length} failed message(s) for automated dispatch.`,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messaging/whatsapp/generate-qr (Admin only - Link device with genuine Baileys handshake)
router.post('/whatsapp/generate-qr', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    const qrResult = await getLatestWhatsAppQr();

    res.json({
      success: true,
      isConnected: qrResult.isConnected,
      qrImage: qrResult.qrImage,
      message: qrResult.message,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messaging/whatsapp/unlink (Admin only - Unlink to change number)
router.post('/whatsapp/unlink', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    const result = await unlinkWhatsAppDevice();

    res.json({
      success: true,
      message: result.message || 'WhatsApp number unlinked successfully. You can now link any new phone/SIM.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
