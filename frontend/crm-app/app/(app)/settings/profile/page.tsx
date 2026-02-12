"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Save, 
  Briefcase, 
  Building2, 
  FileText,
  Edit3
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { profileSettingsSchema } from "@/lib/schemas";
import { z } from "zod";
import { useUser } from "@/contexts/UserContext";

type ProfileFormData = z.infer<typeof profileSettingsSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: user,
  });

  const formValues = watch();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast("Image size should be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        updateUser({ profileImage: imageData });
        showSuccessToast("Profile image updated");
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateUser(data);
      setIsEditing(false);
      showSuccessToast("Profile updated successfully");
    } catch {
      showErrorToast("Failed to update profile");
    }
  };

  const handleCancel = () => {
    reset(user);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        icon={User}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle="Manage your personal information"
        actions={
          <>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                  size="sm"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <Card className="p-6 border border-border">
            <div className="flex flex-col items-center">
              <div className="relative group">
                {user.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-primary/10"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-brand-teal to-brand-purple flex items-center justify-center text-white text-4xl font-bold ring-4 ring-primary/10">
                    {formValues.firstName?.[0]}{formValues.lastName?.[0]}
                  </div>
                )}
                {isEditing && (
                  <>
                    <input
                      type="file"
                      id="profile-image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border-2 border-border shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer hover:scale-110"
                    >
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    </label>
                  </>
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">
                {formValues.firstName} {formValues.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">{formValues.jobTitle}</p>
              <p className="text-sm text-muted-foreground">{formValues.company}</p>
              
              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <span className="break-all">{formValues.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-secondary" />
                  </div>
                  <span>{formValues.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-accent" />
                  </div>
                  <span>{formValues.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <span>Joined {formValues.joinDate}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Information Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-teal to-brand-purple text-white flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <User className="h-4 w-4" />
                  First Name
                </label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        {...register("firstName")}
                        className={`w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                          errors.firstName ? "border-destructive" : "border-border"
                        }`}
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground px-3 py-2">{formValues.firstName}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <User className="h-4 w-4" />
                  Last Name
                </label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        {...register("lastName")}
                        className={`w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                          errors.lastName ? "border-destructive" : "border-border"
                        }`}
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground px-3 py-2">{formValues.lastName}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <input
                        type="email"
                        {...register("email")}
                        className={`w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                          errors.email ? "border-destructive" : "border-border"
                        }`}
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground px-3 py-2">{formValues.email}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <input
                        type="tel"
                        {...register("phone")}
                        className={`w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                          errors.phone ? "border-destructive" : "border-border"
                        }`}
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground px-3 py-2">{formValues.phone}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Work Information */}
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-brand-coral text-white flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Work Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Briefcase className="h-4 w-4" />
                  Job Title
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      {...register("jobTitle")}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.jobTitle ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors.jobTitle && (
                      <p className="text-sm text-destructive mt-1">{errors.jobTitle.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground">{formValues.jobTitle}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("department")}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-foreground">{formValues.department}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      {...register("company")}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.company ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors.company && (
                      <p className="text-sm text-destructive mt-1">{errors.company.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground">{formValues.company}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    {...register("location")}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-foreground">{formValues.location}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Bio */}
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-coral to-brand-purple text-white flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">About</h3>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                Bio
              </label>
              {isEditing ? (
                <textarea
                  {...register("bio")}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-foreground">{formValues.bio}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
