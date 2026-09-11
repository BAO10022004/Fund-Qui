import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../assets/PersonSelectModal.css';
import type { Person } from '../models/Person';
import type { Account } from '../models/Account';

// Danh sách ảnh mẫu phong cách doanh nghiệp / công trường / kỹ thuật / văn phòng như ảnh chụp màn hình
const SAMPLE_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', // Workspace / Dashboard
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', // Kỹ sư / Bản vẽ thiết kế
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80', // Kho vận / Xe tải / Logistics
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80', // Văn phòng / Laptop biểu đồ
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', // Cửa hàng / Vật liệu xây dựng
  'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=800&q=80', // Công trình / Xe cẩu chuyên dụng
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', // Phòng họp hiện đại
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80', // Team làm việc
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', // Chuyên viên tài chính
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', // Tòa nhà hiện đại
];

// Ảnh nền cho thẻ "Tất cả thành viên"
const ALL_MEMBERS_BG = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80';

interface PersonSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: Person[];
  selectedPersonId: string;
  onSelectPerson: (personId: string) => void;
  accounts?: Account[];
}

export const PersonSelectModal: React.FC<PersonSelectModalProps> = ({
  isOpen,
  onClose,
  persons,
  selectedPersonId,
  onSelectPerson,
  accounts = []
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Map avatar từ account sang person dựa trên codePerson
  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach(acc => {
      if (acc.codePerson) {
        map.set(acc.codePerson.trim().toLowerCase(), acc);
      }
    });
    return map;
  }, [accounts]);

  // Quản lý trạng thái mở / đóng với hiệu ứng chuyển động
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (shouldRender) {
      handleCloseWithAnimation();
    }
  }, [isOpen]);

  // Lắng nghe phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shouldRender && !isClosing) {
        handleCloseWithAnimation();
      }
    };
    if (shouldRender) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender, isClosing]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      document.body.style.overflow = '';
    };
  }, []);

  const totalCards = 1 + persons.length; // Thẻ 'Tất cả' + các thẻ thành viên

  // Kích hoạt hiệu ứng đóng ẩn từng người theo chiều ngược lại
  const handleCloseWithAnimation = (onFinishCallback?: () => void) => {
    if (isClosing) return;
    setIsClosing(true);

    // Thời gian chờ để toàn bộ các thẻ ẩn xong lần lượt
    const staggerStep = 0.035; // 35ms mỗi thẻ
    const exitDuration = 0.22; // 220ms thời lượng chuyển động mỗi thẻ
    const totalWaitSeconds = Math.min((totalCards - 1) * staggerStep + exitDuration, 0.45);

    closeTimerRef.current = setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      document.body.style.overflow = '';
      if (onFinishCallback) {
        onFinishCallback();
      }
      onClose();
    }, totalWaitSeconds * 1000);
  };

  const handleSelect = (id: string) => {
    handleCloseWithAnimation(() => {
      onSelectPerson(id);
    });
  };

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`person-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={() => handleCloseWithAnimation()}
    >
      <div
        className="person-modal-container"
        onClick={e => e.stopPropagation()}
      >
        {/* Header với tiêu đề chữ in hoa và nút đóng tròn ở góc phải */}
        <div className="person-modal-header">
          <h2 className="person-modal-title">CHỌN NGƯỜI</h2>
          <button
            type="button"
            className="person-modal-close"
            onClick={() => handleCloseWithAnimation()}
            title="Đóng (ESC)"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Thân toàn màn hình: Lưới các thẻ hình ảnh đại diện vuông vức */}
        <div className="person-modal-body">
          <div className="person-cards-grid">
            {/* Thẻ 0: Tất cả thành viên */}
            {(() => {
              const enterDelay = 0;
              const exitDelay = (totalCards - 1) * 0.035;
              const delay = isClosing ? exitDelay : enterDelay;

              return (
                <div
                  className={`person-card-item person-card-all ${
                    selectedPersonId === 'all' ? 'selected' : ''
                  }`}
                  style={{ animationDelay: `${delay}s` }}
                  onClick={() => handleSelect('all')}
                >
                  <div className="person-card-media">
                    <img
                      src={ALL_MEMBERS_BG}
                      alt="Tất cả thành viên"
                      className="person-card-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="person-card-overlay" />

                  {selectedPersonId === 'all' && (
                    <div className="person-card-badge">✓ Đang chọn</div>
                  )}

                  <div className="person-card-content">
                    <h3 className="person-card-name">TẤT CẢ THÀNH VIÊN</h3>
                    <p className="person-card-sub">Hiển thị toàn bộ giao dịch</p>
                  </div>
                </div>
              );
            })()}

            {/* Thẻ từng thành viên với hiệu ứng xuất hiện / ẩn lần lượt */}
            {persons.map((person, index) => {
              const cardIndex = index + 1;
              const enterDelay = cardIndex * 0.045;
              // Ngược lại khi tắt: thẻ cuối cùng biến mất trước, thẻ đầu biến mất sau
              const exitDelay = (totalCards - 1 - cardIndex) * 0.035;
              const currentDelay = isClosing ? exitDelay : enterDelay;

              const personCodeLower = (person.code || '').trim().toLowerCase();
              const linkedAccount = accountMap.get(personCodeLower);
              const avatarUrl = person.avatar || linkedAccount?.avatar;
              const isSelected = selectedPersonId === person.id;

              // Ảnh nền: nếu có avatar tài khoản thì dùng, ngược lại dùng ảnh theo mẫu
              const cardBgImage = avatarUrl || SAMPLE_BACKGROUNDS[index % SAMPLE_BACKGROUNDS.length];

              return (
                <div
                  key={person.id}
                  className={`person-card-item ${isSelected ? 'selected' : ''}`}
                  style={{ animationDelay: `${currentDelay}s` }}
                  onClick={() => handleSelect(person.id || '')}
                >
                  <div className="person-card-media">
                    <img
                      src={cardBgImage}
                      alt={person.name}
                      className="person-card-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="person-card-overlay" />

                  {/* Huy hiệu khi đang chọn */}
                  {isSelected && (
                    <div className="person-card-badge">✓ Đang chọn</div>
                  )}

                  {/* Huy hiệu mã nhân viên & avatar nhỏ góc trên trái (vuông vức) */}
                  <div className="person-card-avatar-pill">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="person-avatar-thumb"
                      />
                    ) : (
                      <span style={{ fontSize: '13px' }}>👤</span>
                    )}
                    <span className="person-code-tag">{person.code || 'NV'}</span>
                  </div>

                  {/* Nội dung chữ in đậm chữ hoa ở đáy ảnh */}
                  <div className="person-card-content">
                    <h3 className="person-card-name">
                      {person.name} {person.code ? `- ${person.code}` : ''}
                    </h3>
                    <p className="person-card-sub">
                      Mã nhân viên: {person.code || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PersonSelectModal;
