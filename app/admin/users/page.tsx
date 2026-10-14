"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";

import type { TableColumnsType } from "antd";

import { Eye, RefreshCw, Search, Users } from "lucide-react";

import {
  type AdminUser,
  type UserRole,
  type UserStatus,
  getAdminUsers,
  getAdminUserDetail,
  updateUserRole,
  updateUserStatus,
} from "@/api/admin/user";

import { getErrorMessage, getList } from "@/libs/adminHelpers";

const dateText = (value?: string) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";

export default function UsersPage() {
  const { message } = App.useApp();

  const [users, setUsers] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detail, setDetail] = useState<AdminUser | null>(null);

  // =====================================================
  // 1. GET DANH SÁCH
  // =====================================================
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getAdminUsers();

      setUsers(getList<AdminUser>(response.data, "users"));
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // =====================================================
  // 2. TÌM KIẾM VÀ LỌC
  // =====================================================
  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      const matchesSearch = [user.full_name, user.email, user.phone || ""]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, search, roleFilter, statusFilter]);

  // =====================================================
  // 3. XEM CHI TIẾT
  // =====================================================
  const openDetail = async (user: AdminUser) => {
    setDetail(user);

    try {
      setDetailLoading(true);

      const response = await getAdminUserDetail(user._id);

      if (response.data.data) {
        setDetail(response.data.data);
      }
    } catch {
      // Dùng dữ liệu từ danh sách nếu Backend
      // chưa triển khai GET chi tiết.
      message.warning("Đang hiển thị thông tin từ danh sách");
    } finally {
      setDetailLoading(false);
    }
  };

  // =====================================================
  // 4. KHÓA / MỞ KHÓA
  // =====================================================
  const handleChangeStatus = async (user: AdminUser, status: UserStatus) => {
    try {
      setSaving(true);

      await updateUserStatus(user._id, status);

      message.success(
        status === "blocked" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản"
      );

      setDetail(null);

      await fetchUsers();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // 5. PHÂN QUYỀN
  // =====================================================
  const handleChangeRole = async (user: AdminUser, role: UserRole) => {
    try {
      setSaving(true);

      await updateUserRole(user._id, role);

      message.success("Cập nhật quyền tài khoản thành công");

      setDetail(null);

      await fetchUsers();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // 6. CẤU HÌNH BẢNG
  // =====================================================
  const columns: TableColumnsType<AdminUser> = [
    {
      title: "Họ tên",
      dataIndex: "full_name",
      render: (name: string) => (
        <span className="font-semibold text-[#1d3829]">{name}</span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      render: (phone?: string) => phone || "—",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      render: (role: UserRole) => (
        <Tag color={role === "admin" ? "purple" : "blue"}>
          {role === "admin" ? "Quản trị viên" : "Khách hàng"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: UserStatus) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Hoạt động" : "Đã khóa"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date?: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "—",
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 225,
      render: (_, user) => (
        <Space size={3}>
          <Button
            type="text"
            title="Xem chi tiết"
            icon={<Eye size={17} />}
            onClick={() => openDetail(user)}
          />

          <Popconfirm
            title={
              user.status === "active"
                ? "Khóa tài khoản?"
                : "Mở khóa tài khoản?"
            }
            description={user.email}
            okText="Xác nhận"
            cancelText="Hủy"
            onConfirm={() =>
              handleChangeStatus(
                user,
                user.status === "active" ? "blocked" : "active"
              )
            }
          >
            <Button
              type="link"
              size="small"
              danger={user.status === "active"}
              disabled={saving}
            >
              {user.status === "active" ? "Khóa" : "Mở khóa"}
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Thay đổi vai trò?"
            description={
              user.role === "admin"
                ? `Hạ quyền Admin của ${user.email}?`
                : `Cấp quyền Admin cho ${user.email}?`
            }
            okText="Xác nhận"
            cancelText="Hủy"
            onConfirm={() =>
              handleChangeRole(
                user,
                user.role === "admin" ? "customer" : "admin"
              )
            }
          >
            <Button type="link" size="small" disabled={saving}>
              {user.role === "admin" ? "Hạ quyền" : "Cấp Admin"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // =====================================================
  // 7. GIAO DIỆN
  // =====================================================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1d3829]">
          Quản lý người dùng
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Danh sách tài khoản, trạng thái hoạt động và phân quyền trong hệ thống
          HealthyBowl
        </p>
      </div>

      {/* DANH SÁCH */}
      <Card className="!rounded-2xl !border-gray-100 !shadow-sm">
        <div className="mb-5 flex flex-wrap gap-3">
          <Input
            allowClear
            size="large"
            className="!max-w-[340px]"
            placeholder="Tìm tên, email, số điện thoại..."
            prefix={<Search size={17} />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select
            size="large"
            className="!w-[170px]"
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              {
                value: "all",
                label: "Tất cả vai trò",
              },
              {
                value: "admin",
                label: "Admin",
              },
              {
                value: "customer",
                label: "Khách hàng",
              },
            ]}
          />

          <Select
            size="large"
            className="!w-[170px]"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              {
                value: "all",
                label: "Tất cả trạng thái",
              },
              {
                value: "active",
                label: "Hoạt động",
              },
              {
                value: "blocked",
                label: "Đã khóa",
              },
            ]}
          />

          <Button
            icon={<RefreshCw size={16} />}
            loading={loading}
            onClick={fetchUsers}
          >
            Làm mới
          </Button>
        </div>

        <Table<AdminUser>
          rowKey="_id"
          dataSource={filteredUsers}
          columns={columns}
          loading={loading}
          scroll={{ x: 1050 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} tài khoản`,
          }}
          locale={{
            emptyText: (
              <div className="py-8 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-3" />
                Chưa có người dùng
              </div>
            ),
          }}
        />
      </Card>

      {/* DRAWER CHI TIẾT */}
      <Drawer
        title="Thông tin người dùng"
        open={!!detail}
        loading={detailLoading}
        onClose={() => setDetail(null)}
        width={540}
      >
        {detail && (
          <div className="space-y-6">
            {/* PROFILE */}
            <div className="flex items-center gap-4 rounded-xl bg-[#f4f9f5] p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16834b] text-xl font-bold text-white">
                {detail.full_name?.charAt(0).toUpperCase() || "U"}
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#1d3829]">
                  {detail.full_name}
                </h2>

                <p className="text-sm text-gray-500">{detail.email}</p>
              </div>
            </div>

            {/* USER INFO */}
            <Descriptions
              bordered
              column={1}
              size="small"
              items={[
                {
                  key: "id",
                  label: "ID",
                  children: <span className="break-all">{detail._id}</span>,
                },
                {
                  key: "name",
                  label: "Họ tên",
                  children: detail.full_name,
                },
                {
                  key: "email",
                  label: "Email",
                  children: detail.email,
                },
                {
                  key: "phone",
                  label: "Điện thoại",
                  children: detail.phone || "—",
                },
                {
                  key: "role",
                  label: "Vai trò",
                  children: (
                    <Tag color={detail.role === "admin" ? "purple" : "blue"}>
                      {detail.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                    </Tag>
                  ),
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  children: (
                    <Tag color={detail.status === "active" ? "green" : "red"}>
                      {detail.status === "active" ? "Hoạt động" : "Đã khóa"}
                    </Tag>
                  ),
                },
                {
                  key: "created",
                  label: "Ngày tạo",
                  children: dateText(detail.createdAt),
                },
                {
                  key: "updated",
                  label: "Cập nhật gần nhất",
                  children: dateText(detail.updatedAt),
                },
              ]}
            />

            {/* ACTIONS */}
            <div>
              <h3 className="mb-3 font-bold text-[#1d3829]">
                Quản lý tài khoản
              </h3>

              <Space wrap>
                <Popconfirm
                  title={
                    detail.status === "active"
                      ? "Khóa tài khoản?"
                      : "Mở khóa tài khoản?"
                  }
                  description={detail.email}
                  okText="Xác nhận"
                  cancelText="Hủy"
                  onConfirm={() =>
                    handleChangeStatus(
                      detail,
                      detail.status === "active" ? "blocked" : "active"
                    )
                  }
                >
                  <Button loading={saving} danger={detail.status === "active"}>
                    {detail.status === "active"
                      ? "Khóa tài khoản"
                      : "Mở khóa tài khoản"}
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title="Xác nhận đổi quyền?"
                  description={
                    detail.role === "admin"
                      ? "Hạ quyền xuống khách hàng?"
                      : "Cấp quyền quản trị?"
                  }
                  okText="Xác nhận"
                  cancelText="Hủy"
                  onConfirm={() =>
                    handleChangeRole(
                      detail,
                      detail.role === "admin" ? "customer" : "admin"
                    )
                  }
                >
                  <Button loading={saving}>
                    {detail.role === "admin"
                      ? "Hạ quyền Admin"
                      : "Cấp quyền Admin"}
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
