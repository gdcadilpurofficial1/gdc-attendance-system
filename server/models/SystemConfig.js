import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    smsGatewayApiKey: {
      type: String,
      default: () => 'gdc_sms_' + Math.random().toString(36).substring(2, 12),
    },
    autoSendOnSubmit: {
      type: Boolean,
      default: true,
    },
    dispatchIntervalSeconds: {
      type: Number,
      default: 18,
      min: 10,
      max: 60,
    },
    defaultChannel: {
      type: String,
      enum: ['WHATSAPP', 'SMS_GATEWAY'],
      default: 'WHATSAPP',
    },
    whatsappLinked: {
      type: Boolean,
      default: false,
    },
    whatsappPhone: {
      type: String,
      default: '',
    },
    whatsappQrCode: {
      type: String,
      default: null,
    },
    retentionYears: {
      type: Number,
      default: 2,
    },
    messageTemplate: {
      type: String,
      default:
        'محترم {FATHER_NAME}، {RELATION} {STUDENT_NAME}، رول نمبر {ROLL_NO}، ڪلاس {CLASS_NAME} اڄ {DATE} گورنمينٽ ڊگري ڪاليج عادلپور مان غير حاضر (غير حاضر) آهي. مھرباني ڪري حاضري کي يقيني بڻايو. پرنسپال، جي ڊي سي عادلپور.',
    },
  },
  {
    timestamps: true,
  }
);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export default SystemConfig;
