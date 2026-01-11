import React, { useState, useEffect } from 'react';
import Loader from '../Compunents/Loading';
import HeaderMangePerson from '../Compunents/HeaderManagePerson';
import GridDataPerson from '../Compunents/GridDataPerson';
import LoadingSpinner from '../Compunents/LoadingSpinner';
import AddPerson from '../Compunents/AddPerson';
import { getAllPersons } from '../services/PersonService';
import { addPerson, updatePerson, deletePerson } from '../services/PersonService';
import type { Person } from '../models/Person';
const ManagePersons: React.FC = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const data = await getAllPersons();
      setPersons(data);
    } catch (error) {
      alert('Không thể tải danh sách người!');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (person?: Person) => {
    if (person) {
      setEditingPerson(person);
      setFormData({
        name: person.name,
        code: person.code
      });
    } else {
      setEditingPerson(null);
      setFormData({ name: '', code: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      setLoading(true);
      
      if (editingPerson && editingPerson.id) {
        await updatePerson(editingPerson.id, formData);
        alert('✅ Cập nhật thành công!');
      } else {
        await addPerson(formData);
        alert('✅ Thêm người thành công!');
      }
      
      await loadPersons();
      setShowModal(false);
    } catch (error) {
      alert('❌ Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    
    if (window.confirm('Bạn có chắc muốn xóa người này?\n⚠️ Cảnh báo: Các giao dịch liên quan sẽ không bị xóa nhưng có thể bị lỗi hiển thị!')) {
      try {
        setLoading(true);
        await deletePerson(id);
        await loadPersons();
        alert('✅ Xóa thành công!');
      } catch (error) {
        alert('❌ Không thể xóa!');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && persons.length === 0) {
    return (
      <Loader/>    
    );
  }

  return (
    <div >
      <HeaderMangePerson openModal={openModal}/>
      <GridDataPerson 
        persons={persons} 
        openModal={openModal} 
        handleDelete={handleDelete} 
      />
      

      {showModal && (
        <AddPerson
          setShowModal={setShowModal}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          editingPerson={editingPerson}
        />
      )}

      {loading && (
        <LoadingSpinner />
      )}
    </div>
  );
};

export default ManagePersons;