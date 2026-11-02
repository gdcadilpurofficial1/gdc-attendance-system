import Program from '../models/Program.js';
import ClassSection from '../models/ClassSection.js';
import Student from '../models/Student.js';
import { rawXIIRows } from '../data/xiiStudentsData.js';

export const seedXIICohort = async () => {
  console.log('🚀 Starting XII Cohort (Pre-Engineering & Pre-Medical) seeding...');

  // 1. Ensure Programs Exist
  let progEng = await Program.findOne({ code: 'FSC-ENG' });
  if (!progEng) {
    progEng = await Program.create({
      name: 'F.Sc Pre-Engineering',
      code: 'FSC-ENG',
      level: 'Intermediate',
      durationYears: 2,
      description: 'Faculty of Science in Pre-Engineering',
      isActive: true,
    });
    console.log('✅ Created Program: F.Sc Pre-Engineering (FSC-ENG)');
  }

  let progMed = await Program.findOne({ code: 'FSC-MED' });
  if (!progMed) {
    progMed = await Program.create({
      name: 'F.Sc Pre-Medical',
      code: 'FSC-MED',
      level: 'Intermediate',
      durationYears: 2,
      description: 'Faculty of Science in Pre-Medical',
      isActive: true,
    });
    console.log('✅ Created Program: F.Sc Pre-Medical (FSC-MED)');
  }

  // 2. Ensure Class Sections Exist
  let classEng = await ClassSection.findOne({
    programId: progEng._id,
    name: 'XII Pre-Engineering',
  });
  if (!classEng) {
    classEng = await ClassSection.create({
      name: 'XII Pre-Engineering',
      programId: progEng._id,
      academicYear: '2026-2027',
      yearLevel: 'XII',
      section: 'A',
      shift: 'Morning',
      isActive: true,
    });
    console.log('✅ Created Class Section: XII Pre-Engineering');
  }

  let classMed = await ClassSection.findOne({
    programId: progMed._id,
    name: 'XII Pre-Medical',
  });
  if (!classMed) {
    classMed = await ClassSection.create({
      name: 'XII Pre-Medical',
      programId: progMed._id,
      academicYear: '2026-2027',
      yearLevel: 'XII',
      section: 'A',
      shift: 'Morning',
      isActive: true,
    });
    console.log('✅ Created Class Section: XII Pre-Medical');
  }

  // 3. Upsert All 199 Students
  let engCount = 0;
  let medCount = 0;

  for (const row of rawXIIRows) {
    const isMed = row.group === 'PRE-MEDICAL';
    const targetProgramId = isMed ? progMed._id : progEng._id;
    const targetClassId = isMed ? classMed._id : classEng._id;

    // Clean and normalize phone number
    let phone = String(row.phone || '').replace(/\D/g, '');
    if (phone.length === 10 && phone.startsWith('3')) {
      phone = '0' + phone;
    }

    await Student.findOneAndUpdate(
      { classSectionId: targetClassId, rollNo: row.sr },
      {
        rollNo: row.sr,
        fullName: row.name.trim(),
        fatherName: row.fatherName.trim(),
        gender: row.gender === 'Female' ? 'Female' : 'Male',
        programId: targetProgramId,
        classSectionId: targetClassId,
        parentPhone: phone || '03000000000',
        consecutiveAbsences: 0,
        totalDaysPresent: 0,
        totalDaysAbsent: 0,
        totalDaysLeave: 0,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (isMed) medCount++;
    else engCount++;
  }

  console.log(`🎉 Seeding complete! ${engCount} Pre-Engineering and ${medCount} Pre-Medical students synced.`);
  return {
    success: true,
    total: rawXIIRows.length,
    preEngineeringCount: engCount,
    preMedicalCount: medCount,
    programs: [progEng, progMed],
    classes: [classEng, classMed],
  };
};
