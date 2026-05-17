import { useState, useEffect, useRef, useCallback } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Camera, ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { getCoverImageUrl, getProfileImageUrl } from "../utils/eventHelpers";
import { validateImageFile } from "../utils/imageUpload";
import { useToast } from "../components/ui/toast";
import Avatar from "../components/ui/avatar";

const BIO_MAX = 500;

export default function EditProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  const profileBlobRef = useRef(null);
  const coverBlobRef = useRef(null);

  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    location: "",
    email: "",
    phone: "",
  });

  const setProfileBlobPreview = useCallback((blobUrl) => {
    if (profileBlobRef.current) URL.revokeObjectURL(profileBlobRef.current);
    profileBlobRef.current = blobUrl;
    setProfilePreview(blobUrl);
  }, []);

  const setCoverBlobPreview = useCallback((blobUrl) => {
    if (coverBlobRef.current) URL.revokeObjectURL(coverBlobRef.current);
    coverBlobRef.current = blobUrl;
    setCoverPreview(blobUrl);
  }, []);

  useEffect(() => {
    return () => {
      if (profileBlobRef.current) URL.revokeObjectURL(profileBlobRef.current);
      if (coverBlobRef.current) URL.revokeObjectURL(coverBlobRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/users/me");
        setUser(res.data);
        setFormData({
          name: res.data.name || "",
          username: res.data.username || "",
          bio: res.data.bio || "",
          location: res.data.location || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
        });
        setLoadError(null);
      } catch (err) {
        setLoadError(err.response?.data?.message || "Could not load your profile.");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "bio" && value.length > BIO_MAX) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const uploadImageFile = async (file, type) => {
    const err = validateImageFile(file);
    if (err) {
      setFeedback({ type: "error", text: err });
      return false;
    }

    const form = new FormData();
    form.append(type, file);
    const setUploading = type === "profilePic" ? setUploadingProfile : setUploadingCover;
    setFeedback({ type: "", text: "" });
    setUploading(true);

    try {
      const endpoint = type === "profilePic" ? "/users/me/upload" : "/users/me/cover";
      const res = await API.post(endpoint, form);

      if (type === "profilePic") {
        if (profileBlobRef.current) URL.revokeObjectURL(profileBlobRef.current);
        profileBlobRef.current = null;
        setProfilePreview(null);
        setUser((prev) => ({ ...prev, profilePic: res.data.profilePic }));
      } else {
        if (coverBlobRef.current) URL.revokeObjectURL(coverBlobRef.current);
        coverBlobRef.current = null;
        setCoverPreview(null);
        setUser((prev) => ({ ...prev, coverPic: res.data.coverPic }));
      }

      setFeedback({
        type: "success",
        text: type === "profilePic" ? "Profile photo updated." : "Cover image updated.",
      });
      return true;
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Upload failed. Check your connection and try again.",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const onPickProfile = async (e) => {
    const file = e.target.files?.[0];
    const input = e.target;
    if (!file) return;

    const err = validateImageFile(file);
    if (err) {
      setFeedback({ type: "error", text: err });
      input.value = "";
      return;
    }

    setProfileBlobPreview(URL.createObjectURL(file));
    await uploadImageFile(file, "profilePic");
    input.value = "";
  };

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    const input = e.target;
    if (!file) return;

    const err = validateImageFile(file);
    if (err) {
      setFeedback({ type: "error", text: err });
      input.value = "";
      return;
    }

    setCoverBlobPreview(URL.createObjectURL(file));
    await uploadImageFile(file, "coverPic");
    input.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: "", text: "" });
    setFieldErrors({});

    try {
      await API.put("/users/edit", formData);
      toast.success("Profile updated successfully");
      const id = user?.id ?? user?._id ?? "";
      navigate(`/users/${id}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Update failed. Please try again.";
      
      if (errorMessage.toLowerCase().includes("username already taken") || 
          errorMessage.toLowerCase().includes("username already exists")) {
        setFieldErrors({ username: "Username already taken. Please choose another one." });
        toast.error("Username already taken");
      } else if (errorMessage.toLowerCase().includes("email already in use") ||
                 errorMessage.toLowerCase().includes("email already exists")) {
        setFieldErrors({ email: "Email already in use. Please use another email." });
        toast.error("Email already in use");
      } else {
        setFeedback({ type: "error", text: errorMessage });
        toast.error("Update failed. Please try again");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadError && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-geist p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-red-500 text-sm mb-4">{loadError}</p>
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-pink-500 transition-colors">
            <ArrowLeft size={18} /> Back to events
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 font-geist text-gray-400">
        <div className="w-9 h-9 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-sm">Loading your profile...</p>
      </div>
    );
  }

  const profileId = user?.id ?? user?._id ?? "";
  const coverSrc = coverPreview || getCoverImageUrl(user) || null;
  const profileSrc = profilePreview || getProfileImageUrl(user) || null;

  return (
    <div className="min-h-screen bg-gray-50 font-geist py-6 sm:py-8 px-4 sm:px-6 pb-20 ">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <Link to={`/users/${profileId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-pink-500 transition-colors mb-3">
            <ArrowLeft size={18} /> Profile
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1.5">
            Edit profile
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md">
            Update how you appear on TickiSpot. Photos are stored securely; use JPEG, PNG, WebP, GIF, AVIF, or HEIC up to 10MB.
          </p>
        </header>

        {/* Feedback Banner */}
        {feedback.text && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium mb-4 ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`} role="status">
            {feedback.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {feedback.text}
          </div>
        )}

        {/* Cover Section */}
        <div className="relative h-[180px] sm:h-[210px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950">
          {coverSrc && <img src={coverSrc} alt="" className="w-full h-full object-cover" />}
          <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-pink-500 text-white text-xs font-bold cursor-pointer transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 shadow-md shadow-pink-500/30">
            {uploadingCover ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera size={16} /> Change cover
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
              onChange={onPickCover}
              disabled={uploadingCover || uploadingProfile}
              className="hidden"
            />
          </label>
        </div>

        {/* Profile Picture */}
        <div className="relative -mt-12 ml-4 sm:ml-6 z-10 inline-block">
          <Avatar
            src={profileSrc}
            name={formData.name || formData.username || "User"}
            className="w-[90px] h-[90px] sm:w-[108px] sm:h-[108px] rounded-full border-4 border-gray-50 object-cover shadow-lg"
          />
          <label className="absolute bottom-1 right-0 inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-pink-500 text-white text-[0.6rem] font-bold cursor-pointer transition-all duration-200 hover:bg-pink-600">
            {uploadingProfile ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Camera size={12} /> Photo
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
              onChange={onPickProfile}
              disabled={uploadingProfile || uploadingCover}
              className="hidden"
            />
          </label>
        </div>

        {/* Form */}
        <form className="mt-5 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm" onSubmit={handleSubmit}>
          <h2 className="text-base font-extrabold tracking-tight text-gray-900 mb-5">Details</h2>

          {/* Name */}
          <label htmlFor="edit-name" className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Name
          </label>
          <input
            id="edit-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            autoComplete="name"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none mb-4"
          />

          {/* Username */}
          <label htmlFor="edit-username" className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Username
          </label>
          <input
            id="edit-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="username"
            autoComplete="username"
            className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:ring-2 outline-none mb-2 ${
              fieldErrors.username
                ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
            }`}
          />
          {fieldErrors.username && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 mb-3">
              <AlertCircle size={12} /> {fieldErrors.username}
            </div>
          )}

          {/* Bio */}
          <div className="flex items-center justify-between gap-3 mb-1.5 mt-2">
            <label htmlFor="edit-bio" className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
              Bio
            </label>
            <span className="text-xs font-medium text-gray-400">{formData.bio.length}/{BIO_MAX}</span>
          </div>
          <textarea
            id="edit-bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="A short line about you…"
            rows={4}
            maxLength={BIO_MAX}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none resize-y min-h-[110px] mb-4"
          />

          {/* Location */}
          <label htmlFor="edit-location" className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Location
          </label>
          <input
            id="edit-location"
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Lagos, Nigeria"
            autoComplete="address-level1"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none mb-4"
          />

          {/* Email */}
          <label htmlFor="edit-email" className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Email
          </label>
          <input
            id="edit-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:ring-2 outline-none mb-2 ${
              fieldErrors.email
                ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                : "border-gray-200 focus:border-pink-500 focus:ring-pink-100"
            }`}
          />
          {fieldErrors.email && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 mb-3">
              <AlertCircle size={12} /> {fieldErrors.email}
            </div>
          )}

          {/* Phone */}
          <label htmlFor="edit-phone" className="block text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
            Phone
          </label>
          <input
            id="edit-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
            autoComplete="tel"
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none mb-4"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || uploadingProfile || uploadingCover}
            className="w-full h-11 mt-2 rounded-full bg-pink-500 text-white text-sm font-bold transition-all duration-200 hover:bg-pink-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-lg shadow-pink-500/25"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Save changes"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}