export type UserRole = "admin" | "teacher" | "student" | "parent"
export type HwStatus = "pending" | "in_progress" | "completed"
export type LessonStatus = "scheduled" | "completed" | "cancelled" | "makeup"

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  phone?: string
  school_id?: string
  created_at: string
}

export interface Book {
  id: string
  name: string
  publisher: string
  isbn?: string
  subject: string
  grade: string
  school_id: string
}

export interface Chapter {
  id: string
  book_id: string
  name: string
  order_no: number
}

export interface Test {
  id: string
  chapter_id: string
  name: string
  question_count: number
}

export interface AnswerKey {
  id: string
  test_id: string
  question_no: number
  correct_answer: string
}

export interface HomeworkAssignment {
  id: string
  test_id: string
  student_id: string
  assigned_by: string
  deadline: string
  status: HwStatus
}

export interface StudentAnswer {
  id: string
  assignment_id: string
  question_no: number
  given_answer: string
  submitted_at: string
}
