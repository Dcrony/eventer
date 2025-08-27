import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function CreateEvent() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    ticketPrice: "",
    totalTickets: "",
    streamType: "YouTube",
    streamURL: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await API.post("/events/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Event created!");
      navigate("/events");
    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    }
  };

  return (
    <div className="ml-64 p-8"> {/* pushes content aside navbar/sidebar */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Create New Event
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <input
            name="title"
            placeholder="Event Title"
            className="w-full px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
            onChange={handleChange}
            required
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder="Event Description"
            rows="4"
            className="w-full px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
            onChange={handleChange}
            required
          ></textarea>

          {/* Category, Date, Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              name="category"
              placeholder="Category"
              className="px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
              onChange={handleChange}
              required
            />
            <input
              name="date"
              type="date"
              className="px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
              onChange={handleChange}
              required
            />
            <input
              name="time"
              type="time"
              className="px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
              onChange={handleChange}
              required
            />
          </div>

          {/* Location & Image Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="location"
              placeholder="Location"
              className="px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
              onChange={handleChange}
              required
            />

            <label
              htmlFor="imageUpload"
              className="flex items-center justify-center border-2 border-dashed rounded-xl cursor-pointer p-4 hover:border-indigo-400"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : (
                <span className="text-gray-500">Upload Event Image</span>
              )}
            </label>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Ticket Price & Total Tickets */}
          <div className="grid grid-cols-2 gap-4">
            <input
              name="ticketPrice"
              type="number"
              placeholder="₦ Price"
              className="px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
              onChange={handleChange}
              required
            />
            <input
              name="totalTickets"
              type="number"
              placeholder="Total Tickets"
              className="px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
              onChange={handleChange}
              required
            />
          </div>

          {/* Stream Type */}
          <div>
            <label className="block mb-1 text-gray-600">Stream Type</label>
            <select
              name="streamType"
              value={form.streamType}
              className="w-full px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
              onChange={handleChange}
            >
              <option value="YouTube">YouTube</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>

          {/* Stream URL */}
          <input
            name="streamURL"
            placeholder="Stream URL"
            className="w-full px-4 py-2 border rounded-xl focus:ring focus:ring-indigo-300"
            onChange={handleChange}
          />

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition"
          >
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}
