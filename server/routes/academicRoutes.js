import express from 'express';
import Program from '../models/Program.js';
import ClassSection from '../models/ClassSection.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ─────────── PROGRAMS ───────────

// @route   GET /api/academic/programs
router.get('/programs', protect, async (req, res, next) => {
  try {
    const programs = await Program.find().sort({ level: 1, name: 1 });
    res.json({ success: true, count: programs.length, programs });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/academic/programs (Admin only)
router.post('/programs', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    const { name, code, level, durationYears, description } = req.body;
    const program = await Program.create({ name, code, level, durationYears, description });
    res.status(201).json({ success: true, program });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/academic/programs/:id (Admin only)
router.put('/programs/:id', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    const program = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!program) return res.status(404).json({ success: false, message: 'Program not found' });
    res.json({ success: true, program });
  } catch (error) {
    next(error);
  }
});

// ─────────── CLASS SECTIONS ───────────

// @route   GET /api/academic/classes
router.get('/classes', protect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.programId) filter.programId = req.query.programId;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;

    const classes = await ClassSection.find(filter)
      .populate('programId', 'name code level')
      .populate('inchargeTeacherId', 'fullName username')
      .sort({ academicYear: -1, name: 1 });

    res.json({ success: true, count: classes.length, classes });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/academic/classes (Admin only)
router.post('/classes', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    const { name, programId, academicYear, yearLevel, section, shift, inchargeTeacherId } = req.body;
    const newClass = await ClassSection.create({
      name,
      programId,
      academicYear: academicYear || '2026-2027',
      yearLevel,
      section,
      shift: shift || 'Morning',
      inchargeTeacherId: inchargeTeacherId || null,
    });

    const populated = await newClass.populate('programId inchargeTeacherId');
    res.status(201).json({ success: true, classSection: populated });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/academic/classes/:id (Admin only)
router.delete('/classes/:id', protect, authorize('admin', 'principal'), async (req, res, next) => {
  try {
    const deleted = await ClassSection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Class section not found' });
    res.json({ success: true, message: 'Class section deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
