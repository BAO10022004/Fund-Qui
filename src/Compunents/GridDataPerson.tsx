import React from "react";
import type { Person } from "../models/Person";
import "../assets/gridDataPerson.css";
function GridDataPerson({ persons, openModal, handleDelete }:
    { persons: Person[];
      openModal: (person?: Person) => void;
      handleDelete: (id: string) => void;
    })
{
    return(
        <div className="grid-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mã</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody> 
              {persons.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-state">
                    <div className="empty-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <p className="empty-text">Chưa có người nào</p>
                    <p className="empty-subtext">Nhấn nút "Thêm người mới" để bắt đầu</p>
                  </td>
                </tr>
              ) : (
                persons.map(person => (
                  <tr key={person.id}>
                    <td>
                      <div className="person-name">
                        <div className="person-avatar">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <strong>{person.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="person-code">
                        {person.code}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-edit"
                        onClick={() => openModal(person)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Sửa</span>
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(person.id!)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Xóa</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    )
}
export default GridDataPerson;