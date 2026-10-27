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
        'Mohtaram Walid, apka farzand {STUDENT_NAME}, Roll No. {ROLL_NO}, Class {CLASS_NAME} aj {DATE} Govt Degree College Adilpur se ghair-hazir (absent) hai. Baraye meharbani haziri yaqeeni banayein. Principal, GDC Adilpur.',
    },
  },
  {
    timestamps: true,
  }
);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export default SystemConfig;
