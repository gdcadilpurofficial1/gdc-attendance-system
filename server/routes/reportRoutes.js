import express from 'express';
import AttendanceSession from '../models/AttendanceSession.js';
import Student from '../models/Student.js';
import ClassSection from '../models/ClassSection.js';
import TruancyAlert from '../models/TruancyAlert.js';
import { generateAttendanceExcel } from '../services/exportService.js';
import { runRetentionCleanup } from '../services/retentionService.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reports/overview (Dashboard stats)
router.get('/overview', protect, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Counts
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalClasses = await ClassSection.countDocuments({ isActive: true });
    const activeTruancyAlerts = await TruancyAlert.countDocuments({ status: 'ACTIVE' });

    // Today's attendance sessions
    const todaySessions = await AttendanceSession.find({ date: today });
    const classesMarkedToday = todaySessions.length;

    let presentToday = 0;
    let absentToday = 0;

    for (const s of todaySessions) {
      presentToday += s.presentCount;
      absentToday += s.absentCount;
    }

    const totalMarked = presentToday + absentToday;
    const turnoutPercentage = totalMarked > 0 ? ((presentToday / totalMarked) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalClasses,
        classesMarkedToday,
        presentToday,
        absentToday,
        turnoutPercentage: Number(turnoutPercentage),
        activeTruancyAlerts,
        date: today,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reports/export-excel (Download formatted Excel sheet)
router.get('/export-excel', protect, async (req, res, next) => {
  try {
    const { programId, classSectionId, date, startDate, endDate, status, onlyChronicTruants } = req.query;
    const filter = {};

    if (programId) filter.programId = programId;
    if (classSectionId) filter.classSectionId = classSectionId;

    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const sessions = await AttendanceSession.find(filter)
      .populate('classSectionId', 'name')
      .populate('programId', 'name')
      .sort({ date: -1 });

    const buffer = generateAttendanceExcel(sessions, {
      status,
      onlyChronicTruants: onlyChronicTruants === 'true',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=GDC_Adilpur_Attendance_${date || 'Report'}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/reports/run-retention (Admin only - Manual 2-year retention cleanup)
router.post('/run-retention', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    const result = await runRetentionCleanup();
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

export default router;
