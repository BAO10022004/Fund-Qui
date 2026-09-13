export interface Action {
  id?: string;
  name: string;     // Tên hoạt động / loại phạt / tội
  amount?: number;  // Số tiền phạt / mức phí mặc định (VNĐ)
}