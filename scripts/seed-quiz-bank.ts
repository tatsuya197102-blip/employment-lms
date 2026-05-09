// scripts/seed-quiz-bank.ts
// 使い方: npx ts-node scripts/seed-quiz-bank.ts
// 実行前に FIREBASE_ADMIN_* 環境変数を設定すること

import * as admin from 'firebase-admin'
import quizBank from '../quiz_bank_all.json'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = admin.firestore()

async function seedQuizBank() {
  console.log('Seeding quiz bank to Firestore...')
  const batch = db.batch()

  for (const [moduleId, data] of Object.entries(quizBank as Record<string, unknown>)) {
    const ref = db.collection('quizBank').doc(moduleId)
    batch.set(ref, data)
    console.log(`  Queued: ${moduleId} (${(data as { questions: unknown[] }).questions.length} questions)`)
  }

  await batch.commit()
  console.log('\n✅ Quiz bank seeded successfully!')
}

seedQuizBank().catch(console.error)
