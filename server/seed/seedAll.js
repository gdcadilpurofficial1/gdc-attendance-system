import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Program from '../models/Program.js';
import ClassSection from '../models/ClassSection.js';
import Student from '../models/Student.js';
import SystemConfig from '../models/SystemConfig.js';

dotenv.config();

const seedAll = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting database seeding for GDC Adilpur Attendance System...');

    // 1. Seed System Configuration
    await SystemConfig.deleteMany({});
    await SystemConfig.create({
      smsGatewayApiKey: 'gdc_sms_secret_2026',
      autoSendOnSubmit: true,
      dispatchIntervalSeconds: 18,
      defaultChannel: 'WHATSAPP',
      retentionYears: 2,
    });
    console.log('✅ SystemConfig seeded.');

    // 2. Seed Users
    await User.deleteMany({});
    const admin = await User.create({
      username: 'admin',
      fullName: 'System Administrator',
      password: 'Admin@GDC2026!',
      role: 'admin',
      department: 'Administration',
      phone: '03001234567',
    });

    const principal = await User.create({
      username: 'principal',
      fullName: 'Prof. Ghulam Rasool (Principal)',
      password: 'Principal@GDC2026!',
      role: 'principal',
      department: 'College Executive',
      phone: '03011234567',
    });

    const teacher = await User.create({
      username: 'tariq_science',
      fullName: 'Prof. Tariq Mehmood',
      password: 'Teacher@GDC2026!',
      role: 'teacher',
      department: 'Science & Physics',
      phone: '03021234567',
    });
    console.log('✅ Users seeded: admin, principal, tariq_science.');

    // 3. Seed Academic Programs
    await Program.deleteMany({});
    const programsData = [
      { name: 'Intermediate Pre-Medical', code: 'FSC-MED', level: 'Intermediate', durationYears: 2 },
      { name: 'Intermediate Pre-Engineering', code: 'FSC-ENG', level: 'Intermediate', durationYears: 2 },
      { name: 'Intermediate Computer Science (ICS)', code: 'ICS', level: 'Intermediate', durationYears: 2 },
      { name: 'Intermediate Commerce (I.Com)', code: 'ICOM', level: 'Intermediate', durationYears: 2 },
      { name: 'Intermediate Arts & Humanities', code: 'FA-ARTS', level: 'Intermediate', durationYears: 2 },
      { name: 'BS 4-Year English', code: 'BS-ENG', level: 'Bachelor', durationYears: 4 },
      { name: 'BS 4-Year Zoology', code: 'BS-ZOO', level: 'Bachelor', durationYears: 4 },
    ];
    const createdPrograms = await Program.insertMany(programsData);
    console.log(`✅ ${createdPrograms.length} Academic Programs seeded.`);

    const fscMed = createdPrograms.find((p) => p.code === 'FSC-MED');
    const fscEng = createdPrograms.find((p) => p.code === 'FSC-ENG');
    const ics = createdPrograms.find((p) => p.code === 'ICS');

    // 4. Seed Class Sections
    await ClassSection.deleteMany({});
    const classesData = [
      {
        name: 'XI Pre-Medical (Sec A)',
        programId: fscMed._id,
        yearLevel: '1st Year (XI)',
        section: 'A',
        academicYear: '2026-2027',
        inchargeTeacherId: teacher._id,
      },
      {
        name: 'XI Pre-Engineering (Sec A)',
        programId: fscEng._id,
        yearLevel: '1st Year (XI)',
        section: 'A',
        academicYear: '2026-2027',
        inchargeTeacherId: teacher._id,
      },
      {
        name: 'XI Computer Science (Sec A)',
        programId: ics._id,
        yearLevel: '1st Year (XI)',
        section: 'A',
        academicYear: '2026-2027',
      },
      {
        name: 'XII Pre-Medical (Sec A)',
        programId: fscMed._id,
        yearLevel: '2nd Year (XII)',
        section: 'A',
        academicYear: '2026-2027',
      },
    ];
    const createdClasses = await ClassSection.insertMany(classesData);
    console.log(`✅ ${createdClasses.length} Class Sections seeded.`);

    // Assign class to teacher
    teacher.assignedClasses = [createdClasses[0]._id, createdClasses[1]._id];
    await teacher.save();

    // 5. Seed Sample Students for XI Pre-Medical Sec A
    await Student.deleteMany({});
    const xiMedClass = createdClasses[0];

    const sampleStudents = [
      { rollNo: '101', fullName: 'Ali Raza Chachar', fatherName: 'Ghulam Qadir', parentPhone: '03001112233' },
      { rollNo: '102', fullName: 'Bilawal Ahmed Mahar', fatherName: 'Muhammad Ismail', parentPhone: '03012223344' },
      { rollNo: '103', fullName: 'Daniyal Soomro', fatherName: 'Abdul Kareem', parentPhone: '03023334455' },
      { rollNo: '104', fullName: 'Farhan Shar', fatherName: 'Nazar Muhammad', parentPhone: '03034445566' },
      { rollNo: '105', fullName: 'Habibullah Kalhoro', fatherName: 'Sikandar Ali', parentPhone: '03045556677' },
      { rollNo: '106', fullName: 'Imran Khan Pitafi', fatherName: 'Allah Bux', parentPhone: '03056667788' },
      { rollNo: '107', fullName: 'Junaid Malik', fatherName: 'Bashir Ahmed', parentPhone: '03067778899' },
      { rollNo: '108', fullName: 'Kamran Ali Shah', fatherName: 'Syed Zafar Ali', parentPhone: '03078889900' },
      { rollNo: '109', fullName: 'Liaquat Ali Dayo', fatherName: 'Gul Hassan', parentPhone: '03089990011' },
      { rollNo: '110', fullName: 'Muhammad Kashif Indhar', fatherName: 'Haji Ghulam Nabi', parentPhone: '03091113355' },
    ];

    for (const s of sampleStudents) {
      await Student.create({
        ...s,
        programId: fscMed._id,
        classSectionId: xiMedClass._id,
        gender: 'Male',
      });
    }

    console.log(`✅ ${sampleStudents.length} Students seeded for ${xiMedClass.name}.`);
    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedAll();
