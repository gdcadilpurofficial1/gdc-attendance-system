import MessageLog from '../models/MessageLog.js';
import SystemConfig from '../models/SystemConfig.js';
import AttendanceSession from '../models/AttendanceSession.js';

class MessagingQueue {
  constructor() {
    this.isProcessing = false;
    this.queue = [];
    this.currentJob = null;
  }

  // Sleep utility for throttle
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Enqueue absentee records from an attendance session
  async enqueueSessionAbsentees(sessionId) {
    try {
      const session = await AttendanceSession.findById(sessionId).populate('classSectionId');
      if (!session) return;

      const config = (await SystemConfig.findOne()) || (await SystemConfig.create({}));
      if (!config.autoSendOnSubmit) {
        console.log('ℹ️ Auto-send is disabled in SystemConfig. Skipping automatic queue.');
        return;
      }

      const absentees = session.records.filter((r) => r.status === 'ABSENT');
      if (absentees.length === 0) {
        session.messagingStatus = 'COMPLETED';
        await session.save();
        return;
      }

      session.messagingStatus = 'IN_PROGRESS';
      await session.save();

      const className = session.classSectionId?.name || 'Class';
      const todayDate = session.date;

      for (const record of absentees) {
        // Build template
        const messageText = config.messageTemplate
          .replace('{STUDENT_NAME}', record.studentName)
          .replace('{ROLL_NO}', record.rollNo)
          .replace('{CLASS_NAME}', className)
          .replace('{DATE}', todayDate);

        // Create MessageLog entry
        const log = await MessageLog.create({
          recipientPhone: record.parentPhone,
          studentId: record.studentId,
          studentName: record.studentName,
          rollNo: record.rollNo,
          classSectionName: className,
          messageText,
          channel: config.defaultChannel,
          status: 'QUEUED',
        });

        this.queue.push(log._id.toString());
      }

      console.log(`📥 Enqueued ${absentees.length} absentee messages for session ${sessionId}`);

      // Trigger runner if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      console.error('❌ Error enqueuing absentees:', error);
    }
  }

  // Process the queue with 15-20s pacing
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const config = (await SystemConfig.findOne()) || { dispatchIntervalSeconds: 18 };
      const intervalMs = (config.dispatchIntervalSeconds || 18) * 1000;

      while (this.queue.length > 0) {
        const messageLogId = this.queue.shift();
        const log = await MessageLog.findById(messageLogId);
        if (!log) continue;

        this.currentJob = {
          id: log._id,
          studentName: log.studentName,
          recipientPhone: log.recipientPhone,
          channel: log.channel,
          remainingInQueue: this.queue.length,
        };

        log.status = 'SENDING';
        await log.save();

        console.log(
          `🚀 [DISPATCH] Sending to ${log.studentName} (${log.recipientPhone}) via ${log.channel}. Queue remaining: ${this.queue.length}`
        );

        // Simulation or WhatsApp/SMS dispatch
        // In Android SMS Gateway mode, the phone polls queued messages or we mark it SENT
        log.status = 'SENT';
        log.sentAt = new Date();
        await log.save();

        // Safe pacing throttle (18s) to prevent Telco SIM or WhatsApp ban
        if (this.queue.length > 0) {
          console.log(`⏳ Pacer: Waiting ${config.dispatchIntervalSeconds}s before next message...`);
          await this.sleep(intervalMs);
        }
      }

      this.currentJob = null;
      console.log('✅ Messaging queue completed all active dispatches.');
    } catch (error) {
      console.error('❌ Error processing messaging queue:', error);
    } finally {
      this.isProcessing = false;
      this.currentJob = null;
    }
  }

  // Live status for Admin Dashboard
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      currentJob: this.currentJob,
    };
  }
}

export const messagingQueue = new MessagingQueue();
export default messagingQueue;
