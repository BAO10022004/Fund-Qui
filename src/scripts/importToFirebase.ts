// src/scripts/importToFirebase.ts
// Script để import dữ liệu từ JSON files lên Firebase
// Chạy: npx ts-node src/scripts/importToFirebase.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';

// ===== THAY CONFIG CỦA BẠN Ở ĐÂY =====
const firebaseConfig = {
  apiKey: "AIzaSyA10PZvSjqFMlqEo-oyn4AS7gCdPsDGVJ8",
  authDomain: "fund-22b8b.firebaseapp.com",
  projectId: "fund-22b8b",
  storageBucket: "fund-22b8b.firebasestorage.app",
  messagingSenderId: "731482890144",
  appId: "1:731482890144:web:46cd8ab00f1c7f51450ec5",
  measurementId: "G-QB1V1LMBGG"
};
// ====================================

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dữ liệu mẫu - thay bằng dữ liệu thực của bạn
const samplePersons = [
  { name: "Nguyễn Văn A", code: "NVA001" },
  { name: "Trần Thị B", code: "TTB002" },
  { name: "Lê Văn C", code: "LVC003" },
  { name: "Phạm Thị D", code: "PTD004" },
  { name: "Hoàng Văn E", code: "HVE005" }
];

const sampleTransactions = [
  {
    date: "2024-01-15",
    dayOfWeek: "Thứ 2",
    amount: 50000,
    type: "chi",
    description: "Đi trễ",
    personId: "", // Sẽ được cập nhật sau khi import persons
    personName: "Nguyễn Văn A - NVA001",
    status: "completed"
  },
  {
    date: "2024-01-20", 
    dayOfWeek: "Thứ 7",
    amount: 100000,
    type: "thu",
    description: "Đóng quỹ tháng",
    personId: "",
    personName: "Trần Thị B - TTB002",
    status: "completed"
  }
];

async function checkExistingData() {
  console.log('🔍 Kiểm tra dữ liệu hiện có...\n');
  
  const personsSnapshot = await getDocs(collection(db, 'persons'));
  const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
  
  console.log(`📊 Persons: ${personsSnapshot.size} documents`);
  console.log(`📊 Transactions: ${transactionsSnapshot.size} documents\n`);
  
  if (personsSnapshot.size > 0 || transactionsSnapshot.size > 0) {
    console.log('⚠️  CẢNH BÁO: Database đã có dữ liệu!');
    console.log('Nếu muốn reset, vào Firebase Console và xóa collection trước.\n');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      readline.question('Bạn có muốn tiếp tục import thêm dữ liệu? (y/n): ', (answer: string) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }
  
  return true;
}

async function importPersons() {
  console.log('👥 Đang import persons...');
  const personIds: { [key: string]: string } = {};
  
  for (const person of samplePersons) {
    const docRef = await addDoc(collection(db, 'persons'), {
      ...person,
      createdAt: Timestamp.now()
    });
    personIds[person.code] = docRef.id;
    console.log(`  ✓ ${person.name} - ${person.code}`);
  }
  
  console.log(`✅ Import ${samplePersons.length} persons thành công!\n`);
  return personIds;
}

async function importTransactions(_personIds: { [key: string]: string }) {
  console.log('💰 Đang import transactions...');
  
  // Lấy danh sách persons từ Firebase để map
  const personsSnapshot = await getDocs(collection(db, 'persons'));
  const personsMap = new Map();
  personsSnapshot.forEach(doc => {
    const data = doc.data();
    personsMap.set(data.code, { id: doc.id, ...data });
  });
  
  for (const transaction of sampleTransactions) {
    // Extract code từ personName
    const code = transaction.personName.split(' - ')[1];
    const person = personsMap.get(code);
    
    if (person) {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        personId: person.id,
        createdAt: Timestamp.now()
      });
      console.log(`  ✓ ${transaction.description} - ${transaction.personName}`);
    }
  }
  
  console.log(`✅ Import ${sampleTransactions.length} transactions thành công!\n`);
}

async function main() {
  console.log('🚀 BẮT ĐẦU IMPORT DỮ LIỆU VÀO FIREBASE\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    const shouldContinue = await checkExistingData();
    
    if (!shouldContinue) {
      console.log('\n❌ Hủy import!');
      process.exit(0);
    }
    
    console.log('=' .repeat(50) + '\n');
    
    const personIds = await importPersons();
    await importTransactions(personIds);
    
    console.log('=' .repeat(50));
    console.log('🎉 HOÀN TẤT IMPORT!');
    console.log('=' .repeat(50));
    console.log('\n📱 Bây giờ bạn có thể mở app và xem dữ liệu!');
    console.log('🌐 Firebase Console: https://console.firebase.google.com/');
    
  } catch (error) {
    console.error('\n❌ LỖI KHI IMPORT:', error);
  }
  
  process.exit(0);
}

main();