import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useConfirm } from '../components/ui/ConfirmProvider';
import toast from 'react-hot-toast';
import { changePassword, deleteProfile, updateProfile, uploadAvatar } from '../api/growthos';
import { getFullAvatarUrl } from '../lib/utils';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const supportedAvatarTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    const details = error.response?.data?.errors;
    if (Array.isArray(details) && details.every(item => typeof item === 'string')) return details.join(' ');
  }
  return fallback;
}

function ProfileAvatar({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [avatarUrl]);
  const imageUrl = getFullAvatarUrl(avatarUrl);

  return (
    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-emerald-400 p-[3px] shadow-lg">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#09090b] text-2xl font-bold text-accent">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={`${name || 'User'} profile photo`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden="true">{name.trim().charAt(0).toUpperCase() || '👤'}</span>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { userName, userEmail, avatarUrl, updateUser, signOut } = useAuth();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(userName ?? '');
  const [email, setEmail] = useState(userEmail ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setName(userName ?? '');
    setEmail(userEmail ?? '');
  }, [userName, userEmail]);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError('');
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !/^[a-zA-Z\s]+$/.test(cleanName)) {
      setProfileError('Enter a name using letters and spaces only.');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setProfileError('Enter a valid email address.');
      return;
    }

    setSavingProfile(true);
    try {
      const updatedUser = await updateProfile({ name: cleanName, email: cleanEmail });
      updateUser({ userName: updatedUser.name, userEmail: updatedUser.email });
      toast.success('Profile updated');
    } catch (error) {
      const message = errorMessage(error, 'Could not update your profile. Please try again.');
      setProfileError(message);
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > 1024 * 1024) {
      const message = 'Image must be 1 MB or smaller.';
      setProfileError(message);
      toast.error(message);
      return;
    }
    if (!supportedAvatarTypes.has(file.type)) {
      const message = 'Choose a PNG, JPG, or WEBP image.';
      setProfileError(message);
      toast.error(message);
      return;
    }

    setProfileError('');
    setUploadingAvatar(true);
    try {
      const updatedUser = await uploadAvatar(file);
      updateUser({ avatarUrl: updatedUser.avatarUrl ?? null });
      toast.success('Profile photo updated');
    } catch (error) {
      const message = errorMessage(error, 'Could not upload the photo. Please try again.');
      setProfileError(message);
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Complete all password fields.');
      return;
    }
    if (!passwordPattern.test(newPassword)) {
      setPasswordError('Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character (@$!%*?&).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('Choose a new password that differs from your current password.');
      return;
    }

    setChangingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      updateUser({ token: result.token });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated. Other sessions have been signed out.');
    } catch (error) {
      const message = errorMessage(error, 'Could not update your password. Please try again.');
      setPasswordError(message);
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: 'Delete account permanently?',
      message: 'This permanently deletes your account and associated tasks, habits, goals, Journal entries, insights, and the locally stored profile photo where safe cleanup is possible. This action cannot be undone.',
      confirmLabel: 'Delete account',
      variant: 'danger',
    });
    if (!confirmed) return;
    setDeletingAccount(true);
    try {
      await deleteProfile();
      toast.success('Account deleted');
      signOut();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not delete your account. Please try again.'));
      setDeletingAccount(false);
    }
  };

  const fieldClass = 'field-input !h-12 !w-full !px-4 !text-sm !bg-[#09090b] border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent';
  const passwordInputClass = `${fieldClass} !pr-16`;

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-1">
        <h1 className="title-main">Profile & Settings</h1>
        <p className="title-sub text-zinc-400">Update your profile, secure your account, or manage account deletion.</p>
      </div>

      <div className="flex flex-col gap-5">
      <Card className="primary flex h-full flex-col bg-[#0c0c0e] p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white">Profile</h2>
          <p className="mt-1 text-sm text-zinc-400">Your photo, name, and email address.</p>
        </div>

        <div className="mb-4 flex flex-col items-center gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
          <ProfileAvatar avatarUrl={avatarUrl} name={name} />
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <input
              ref={fileInputRef}
              type="file"
              id="profile-photo"
              hidden
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar || savingProfile}
            />
            <Button
              type="button"
              disabled={uploadingAvatar || savingProfile}
              onClick={() => fileInputRef.current?.click()}
              className="!rounded-xl !border !border-white/10 !bg-white/5 !px-5 !py-2.5 !text-xs !font-bold !text-white hover:!bg-white/10 disabled:opacity-50"
            >
              {uploadingAvatar ? 'UPLOADING PHOTO…' : 'CHANGE PHOTO'}
            </Button>
            <span className="text-xs text-zinc-400">PNG, JPG, or WEBP · up to 1 MB</span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-1 flex-col gap-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label htmlFor="profile-name" className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Full name</span>
              <input
                id="profile-name"
                className={fieldClass}
                value={name}
                onChange={event => setName(event.target.value)}
                autoComplete="name"
                required
                maxLength={120}
                disabled={savingProfile}
              />
            </label>
            <label htmlFor="profile-email" className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Email address</span>
              <input
                id="profile-email"
                className={fieldClass}
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                autoComplete="email"
                required
                maxLength={254}
                disabled={savingProfile}
              />
            </label>
          </div>
          {profileError && <p role="alert" className="text-sm text-rose-300">{profileError}</p>}
          <div className="mt-auto flex justify-end pt-1">
            <Button
              type="submit"
              disabled={savingProfile || uploadingAvatar}
              className="w-full !rounded-xl !bg-accent !px-8 !py-3 !text-xs !font-bold !text-white hover:!bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {savingProfile ? 'SAVING PROFILE…' : 'SAVE PROFILE'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="primary flex h-full flex-col bg-[#0c0c0e] p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white">Password & Security</h2>
          <p className="mt-1 text-sm text-zinc-400">Changing your password signs out other active sessions.</p>
        </div>
        <form onSubmit={handleChangePassword} className="grid flex-1 grid-cols-1 content-start gap-x-4 gap-y-4 sm:grid-cols-2" noValidate>
          {[
            { id: 'current-password', label: 'Current password', value: currentPassword, setter: setCurrentPassword, autoComplete: 'current-password', className: 'sm:col-span-2' },
            { id: 'new-password', label: 'New password', value: newPassword, setter: setNewPassword, autoComplete: 'new-password', className: '' },
            { id: 'confirm-password', label: 'Confirm new password', value: confirmPassword, setter: setConfirmPassword, autoComplete: 'new-password', className: '' },
          ].map(field => (
            <label key={field.id} htmlFor={field.id} className={`flex flex-col gap-1.5 ${field.className}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{field.label}</span>
              <span className="relative">
                <input
                  id={field.id}
                  className={passwordInputClass}
                  type={showPasswords ? 'text' : 'password'}
                  value={field.value}
                  onChange={event => field.setter(event.target.value)}
                  autoComplete={field.autoComplete}
                  disabled={changingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(value => !value)}
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                  aria-pressed={showPasswords}
                  className="absolute inset-y-0 right-2 rounded-md px-2 text-xs font-semibold text-accent hover:text-white focus:ring-2 focus:ring-accent"
                >
                  {showPasswords ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
          ))}
          <p className="text-xs text-zinc-500 sm:col-span-2">At least 8 characters with uppercase and lowercase letters, a number, and one of @$!%*?&amp;.</p>
          {passwordError && <p role="alert" className="text-sm text-rose-300 sm:col-span-2">{passwordError}</p>}
          <div className="mt-auto flex justify-end pt-1 sm:col-span-2">
            <Button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full !rounded-xl !bg-accent !px-8 !py-3 !text-xs !font-bold !text-white hover:!bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {changingPassword ? 'UPDATING PASSWORD…' : 'UPDATE PASSWORD'}
            </Button>
          </div>
        </form>
      </Card>
      </div>

      <Card className="primary compact-card border border-rose-500/20 bg-rose-950/10 p-4 sm:p-6">
        <h2 className="mb-2 text-base font-bold text-rose-300">Account deletion</h2>
        <p className="mb-5 text-sm leading-relaxed text-zinc-300">
          Permanently remove your account and associated GrowthOS records. This cannot be undone and requires confirmation.
        </p>
        <Button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          className="w-full !rounded-xl !border !border-rose-500/30 !bg-rose-500/10 !px-5 !py-2.5 !text-xs !font-bold !text-rose-300 hover:!bg-rose-500/20 disabled:opacity-50 sm:w-auto"
        >
          {deletingAccount ? 'DELETING ACCOUNT…' : 'DELETE ACCOUNT'}
        </Button>
      </Card>
    </div>
  );
}
