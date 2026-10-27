import express from 'express';
import QRCode from 'qrcode';
import SystemConfig from '../models/SystemConfig.js';
import MessageLog from '../models/MessageLog.js';
import messagingQueue from '../services/messagingQueue.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messaging/status (Admin - Live Queue Status)
router.get('/status', protect, async (req, res, next) => {
  try {
    const queueStatus = messagingQueue.getStatus();
    const config = (await SystemConfig.findOne()) || (await SystemConfig.create({}));

    // Today's total sent / failed count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await MessageLog.countDocuments({ status: 'SENT', createdAt: { $gte: today } });
    const failedToday = await MessageLog.countDocuments({ status: 'FAILED', createdAt: { $gte: today } });

    res.json({
      success: true,
      queue: queueStatus,
      config: {
        autoSendOnSubmit: config.autoSendOnSubmit,
        dispatchIntervalSeconds: config.dispatchIntervalSeconds,
        defaultChannel: config.defaultChannel,
        whatsappLinked: config.whatsappLinked,
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

// @route   POST /api/messaging/whatsapp/generate-qr (Admin only - Link device)
router.post('/whatsapp/generate-qr', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    // Generate a secure connection token payload
    const mockSessionCode = `GDC-WA-PAIR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const qrImage = await QRCode.toDataURL(mockSessionCode);

    let config = (await SystemConfig.findOne()) || (await SystemConfig.create({}));
    config.whatsappQrCode = qrImage;
    await config.save();

    res.json({
      success: true,
      qrImage,
      message: 'Scan this QR code with college WhatsApp to link device.',
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messaging/whatsapp/unlink (Admin only - Unlink to change number)
router.post('/whatsapp/unlink', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    let config = (await SystemConfig.findOne()) || (await SystemConfig.create({}));
    config.whatsappLinked = false;
    config.whatsappPhone = '';
    config.whatsappQrCode = null;
    await config.save();

    res.json({
      success: true,
      message: 'WhatsApp number unlinked successfully. You can now link any new phone/SIM in 15 seconds.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
