import { useCallback, useEffect, useState } from 'react';
import { fetchAdminRooms, loadSession } from '../api/auth';
import AddRoomModal from '../components/AddRoomModal';
import EditRoomModal from '../components/EditRoomModal';

export default function AdminRooms() {
  const session = loadSession();
  const role = (session?.profile?.role || 'student').toLowerCase();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const loadRooms = useCallback(async () => {
    try {
      const response = await fetchAdminRooms(session?.token);
      setRooms(response.rooms || []);
    } catch (error) {
      console.error('Không tải được danh sách phòng:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  if (role !== 'organizer' && role !== 'admin') {
    return <div className="p-6 text-sm text-rose-600">Access denied: Organizer/Admin required.</div>;
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-surface-container-low">
      <div className="flex flex-col justify-between gap-4 border-b border-surface-variant bg-surface px-4 py-6 sm:px-6 md:flex-row md:items-center md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div>
          <h1 className="font-h1 text-on-surface">Rooms Management</h1>
          <p className="mt-1 font-body-md text-on-surface-variant">
            Quản lý tên phòng, sức chứa và ảnh layout trong Supabase Storage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="ui-btn ui-btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 font-label-md shadow-md transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Room
          </button>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-[#003366]">meeting_room</span>
            {rooms.length} rooms
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-container-max flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-on-surface-variant">Đang tải danh sách phòng...</div>
            ) : rooms.length === 0 ? (
              <div className="p-12 text-center italic text-on-surface-variant">Chưa có phòng nào.</div>
            ) : (
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-slate-50">
                    <th className="p-5 text-sm font-bold text-slate-700">Room</th>
                    <th className="p-5 text-sm font-bold text-slate-700">Capacity</th>
                    <th className="p-5 text-sm font-bold text-slate-700">Layout Image</th>
                    <th className="p-5 text-right text-sm font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant bg-white">
                  {rooms.map((room) => (
                    <tr key={room.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                            <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{room.name}</h4>
                            <p className="mt-0.5 text-xs text-slate-500">ID #{room.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm font-medium text-slate-700">{room.capacity}</td>
                      <td className="p-5">
                        {room.layout_image_url ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={room.layout_image_url}
                              alt={room.name}
                              className="h-14 w-20 rounded-xl border border-slate-200 object-cover"
                            />
                            <span className="max-w-[280px] truncate text-xs text-slate-500">{room.layout_image_url}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">No image</span>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingRoom(room)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddRoomModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            loadRooms();
          }}
        />
      )}

      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
          onSaved={() => {
            setEditingRoom(null);
            loadRooms();
          }}
        />
      )}
    </main>
  );
}