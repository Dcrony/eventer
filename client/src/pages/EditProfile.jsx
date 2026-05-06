import { useState, useEffect, useRef, useCallback } from "react";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Camera, ImageIcon } from "lucide-react";
import { getCoverImageUrl, getProfileImageUrl } from "../utils/eventHelpers";
import { validateImageFile } from "../utils/imageUpload";
import "./CSS/EditProfile.css";
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
      const endpoint =
        type === "profilePic" ? "/users/me/upload" : "/users/me/cover";
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
        text:
          type === "profilePic"
            ? "Profile photo updated."
            : "Cover image updated.",
      });
      return true;
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err.response?.data?.message ||
          "Upload failed. Check your connection and try again.",
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
    try {
      await API.put("/users/edit", formData);
      toast.success("Profile updated successfully");
      const id = user?.id ?? user?._id ?? "";
      navigate(`/users/${id}`);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Update failed. Please try again.",
      });
      toast.error("Update failed. Please try again");
    } finally {
      setSaving(false);
    }
  };

  if (loadError && !user) {
    return (
      <div className="editprofile-page editprofile-page--centered">
        <div className="editprofile-card editprofile-card--narrow">
          <p className="editprofile-error-text">{loadError}</p>
          <Link to="/events" className="editprofile-back-link">
            <ArrowLeft size={18} />
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="editprofile-loading">
        <div className="spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const profileId = user?.id ?? user?._id ?? "";
  const coverSrc = coverPreview || getCoverImageUrl(user) || "/cover.jpg";
  const profileSrc = profilePreview || getProfileImageUrl(user) || null;

  return (
    <div className="editprofile-page">
      <div className="editprofile-inner">
        <header className="editprofile-header">
          <Link to={`/users/${profileId}`} className="editprofile-back-link">
            <ArrowLeft size={20} />
            Profile
          </Link>
          <h1 className="editprofile-heading">Edit profile</h1>
          <p className="editprofile-lead">
            Update how you appear on TickiSpot. Photos are stored securely; use
            JPEG, PNG, WebP, GIF, AVIF, or HEIC up to 10MB.
          </p>
        </header>

        {feedback.text ? (
          <div
            className={`editprofile-banner editprofile-banner--${feedback.type}`}
            role="status"
          >
            {feedback.text}
          </div>
        ) : null}

        <div className="cover-section">
          <img src={coverSrc} alt="" className="cover-image" />
          <label className="cover-upload">
            {uploadingCover ? (
              <>
                <ImageIcon size={18} />
                Uploading…
              </>
            ) : (
              <>
                <Camera size={18} />
                Change cover
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
              onChange={onPickCover}
              disabled={uploadingCover || uploadingProfile}
            />
          </label>
        </div>

        <div className="profile-pic-wrapper">
          <Avatar
            src={profileSrc}
            name={formData.name || formData.username || "User"}
            className="profile-pic"
          />
          <label className="profile-upload">
            {uploadingProfile ? (
              <>
                <ImageIcon size={14} />
                …
              </>
            ) : (
              <>
                <Camera size={14} />
                Photo
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
              onChange={onPickProfile}
              disabled={uploadingProfile || uploadingCover}
            />
          </label>
        </div>

        <form className="editprofile-form" onSubmit={handleSubmit}>
          <h2 className="editprofile-form-title">Details</h2>

          <label htmlFor="edit-name">Name</label>
          <input
            id="edit-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            autoComplete="name"
          />

          <label htmlFor="edit-username">Username</label>
          <input
            id="edit-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="username"
            autoComplete="username"
          />

          <div className="editprofile-bio-row">
            <label htmlFor="edit-bio">Bio</label>
            <span className="editprofile-char-count">
              {formData.bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="edit-bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="A short line about you…"
            rows={4}
            maxLength={BIO_MAX}
          />

          <label htmlFor="edit-location">Location</label>
          <input
            id="edit-location"
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Lagos, Nigeria"
            autoComplete="address-level1"
          />

          <label htmlFor="edit-email">Email</label>
          <input
            id="edit-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label htmlFor="edit-phone">Phone</label>
          <input
            id="edit-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
            autoComplete="tel"
          />

          <button
            type="submit"
            className="editprofile-save"
            disabled={saving || uploadingProfile || uploadingCover}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
