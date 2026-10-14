"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import {
  App,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
} from "antd";
import type { TableColumnsType } from "antd";

import { Eye, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import ImageFileField from "@/components/admin/ImageFileField";

import {
  Category,
  CategoryPayload,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/admin/category";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "Yêu cầu không thành công";
  }

  return error instanceof Error ? error.message : "Đã xảy ra lỗi";
}

export default function CategoriesPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<CategoryPayload>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [detail, setDetail] = useState<Category | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await getCategories();
      const result = response.data.data;

      const list = Array.isArray(result)
        ? result
        : result.categories || result.items || [];

      setCategories(list);
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData = categories.filter((category) => {
    const keyword = search.trim().toLowerCase();

    return (
      category.name.toLowerCase().includes(keyword) ||
      (category.description || "").toLowerCase().includes(keyword)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setSelectedImage(null);

    form.resetFields();
    form.setFieldsValue({
      name: "",
      description: "",
      image_url: "",
    });

    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setSelectedImage(null);

    form.setFieldsValue({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
    setSelectedImage(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      setSaving(true);

      const payload: CategoryPayload = {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        image_url: editing?.image_url || "",
      };

      if (editing) {
        await updateCategory(editing._id, payload, selectedImage);

        message.success("Cập nhật danh mục thành công");
      } else {
        await createCategory(payload, selectedImage);

        message.success("Thêm danh mục thành công");
      }

      closeAfterSave();
      await fetchData();
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      message.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const closeAfterSave = () => {
    setModalOpen(false);
    setEditing(null);
    setSelectedImage(null);
    form.resetFields();
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteCategory(id);

      message.success("Xóa danh mục thành công");

      if (detail?._id === id) {
        setDetail(null);
      }

      await fetchData();
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<Category> = [
    {
      title: "Ảnh",
      dataIndex: "image_url",
      width: 95,
      render: (src?: string) =>
        src ? (
          <img
            src={src}
            alt="Danh mục"
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
            Không ảnh
          </div>
        ),
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      render: (name: string) => (
        <span className="font-semibold text-[#1c4630]">{name}</span>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      render: (value?: string) => value || "—",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            title="Xem chi tiết"
            icon={<Eye size={17} />}
            onClick={() => setDetail(record)}
          />

          <Button
            type="text"
            title="Chỉnh sửa"
            icon={<Pencil size={17} />}
            onClick={() => openEdit(record)}
          />

          <Popconfirm
            title="Xóa danh mục?"
            description={`Xóa "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{
              danger: true,
              loading: deletingId === record._id,
            }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              type="text"
              danger
              icon={<Trash2 size={17} />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1d3829]">
            Quản lý danh mục
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Danh sách, thêm, sửa, xóa và quản lý ảnh danh mục
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<Plus size={17} />}
          onClick={openCreate}
        >
          Thêm danh mục
        </Button>
      </div>

      <Card className="!rounded-2xl !border-gray-100">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Input
            size="large"
            allowClear
            placeholder="Tìm kiếm danh mục..."
            prefix={<Search size={17} />}
            className="!max-w-[360px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button
            icon={<RefreshCw size={16} />}
            loading={loading}
            onClick={fetchData}
          >
            Làm mới
          </Button>
        </div>

        <Table<Category>
          rowKey="_id"
          dataSource={filteredData}
          columns={columns}
          loading={loading}
          scroll={{ x: 750 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} danh mục`,
          }}
        />
      </Card>

      {/* MODAL THÊM / SỬA */}
      <Modal
        title={editing ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editing ? "Lưu thay đổi" : "Thêm mới"}
        cancelText="Hủy"
        closable={!saving}
        maskClosable={!saving}
        destroyOnHidden
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="!mt-5"
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên danh mục",
              },
            ]}
          >
            <Input
              size="large"
              maxLength={100}
              placeholder="Nhập tên danh mục"
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} placeholder="Nhập mô tả..." />
          </Form.Item>

          <Form.Item label="Hình ảnh">
            <ImageFileField
              imageUrl={editing?.image_url}
              file={selectedImage}
              onChange={setSelectedImage}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* CHI TIẾT DANH MỤC */}
      <Drawer
        title="Chi tiết danh mục"
        open={!!detail}
        width={480}
        onClose={() => setDetail(null)}
        extra={
          detail && (
            <Button
              type="primary"
              onClick={() => {
                const category = detail;
                setDetail(null);
                openEdit(category);
              }}
            >
              Chỉnh sửa
            </Button>
          )
        }
      >
        {detail && (
          <div className="space-y-6">
            {detail.image_url ? (
              <img
                src={detail.image_url}
                alt={detail.name}
                className="h-52 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-52 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                Chưa có hình ảnh
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400">Tên danh mục</p>
              <h3 className="mt-1 text-xl font-bold">{detail.name}</h3>
            </div>

            <div>
              <p className="text-xs text-gray-400">Mô tả</p>
              <p className="mt-2 whitespace-pre-wrap text-gray-700">
                {detail.description || "Chưa có mô tả"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">ID danh mục</p>
              <code className="mt-1 block break-all text-sm">{detail._id}</code>
            </div>

            {detail.createdAt && (
              <div>
                <p className="text-xs text-gray-400">Ngày tạo</p>
                <p className="mt-1">
                  {new Date(detail.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
