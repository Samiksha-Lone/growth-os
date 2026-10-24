import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { updateProfile, deleteProfile, uploadAvatar } from '../api/growthos';
import { getFullAvatarUrl } from '../lib/utils';

export default function SettingsPage() {
  const { userName, userEmail, githubUrl, linkedinUrl, portfolioUrl, avatarUrl, updateUser, signOut } = useAuth();

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [socials, setSocials] = useState({
    github: '',
    linkedin: '',
    portfolio: ''
  });

  // Sync form state with auth context
  useEffect(() => {
    setProfile({
      firstName: (userName?.split(' ')[0]) || '',
      lastName: (userName?.split(' ').slice(1).join(' ')) || '',
      email: userEmail || ''
    });
    setSocials({
      github: githubUrl || '',
      linkedin: linkedinUrl || '',
      portfolio: portfolioUrl || ''
    });
  }, [userName, userEmail, githubUrl, linkedinUrl, portfolioUrl]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await updateProfile({
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        githubUrl: socials.github || undefined,
        linkedinUrl: socials.linkedin || undefined,
        portfolioUrl: socials.portfolio || undefined,
        avatarUrl: avatarUrl || undefined
      });

      updateUser({
        userName: updatedUser.name,
        userEmail: updatedUser.email,
        githubUrl: updatedUser.githubUrl,
        linkedinUrl: updatedUser.linkedinUrl,
        portfolioUrl: updatedUser.portfolioUrl,
        avatarUrl: updatedUser.avatarUrl
      });

      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('File is too large (max 1MB)');
      return;
    }

    setUploading(true);
    try {
      const updatedUser = await uploadAvatar(file);
      updateUser({ avatarUrl: updatedUser.avatarUrl });
      toast.success('Avatar updated');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('CRITICAL: This will permanently delete your GrowthOS account and all associated data. Are you absolutely sure?')) {
      try {
        await deleteProfile();
        toast.success('Account deleted');
        signOut();
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-1">
        <h1 className="title-main">My Profile</h1>
        <p className="title-sub text-zinc-400">Manage your credentials, connected links, and workspace preferences.</p>
      </div>

      <div className="split-layout">
        <div className="stack-gap-lg min-w-0">
          {/* Profile Section */}
          <Card className="primary p-4 sm:p-6 bg-[#0c0c0e]">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-6">User Account</span>
             
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 pb-8 border-b border-white/10 text-center sm:text-left">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-emerald-400 p-[3px] overflow-hidden flex-shrink-0 shadow-lg">
                <div className="w-full h-full rounded-full bg-[#09090b] flex items-center justify-center text-3xl overflow-hidden">
                  {avatarUrl ? (
                    <img 
                      src={getFullAvatarUrl(avatarUrl)!} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<span style="font-size:2rem">👤</span>';
                      }}
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-start gap-2">
                <input 
                  type="file" 
                  id="avatar-input" 
                  hidden 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                />
                <Button 
                  disabled={uploading}
                  onClick={() => document.getElementById('avatar-input')?.click()} 
                  className="!bg-white/5 hover:!bg-white/10 !border !border-white/10 !text-white !text-xs !font-bold !px-5 !py-2.5 !rounded-xl transition-all"
                >
                  {uploading ? 'UPLOADING...' : 'CHANGE PHOTO'}
                </Button>
                <span className="text-xs text-zinc-400 font-medium">PNG or JPG up to 1.0 MB</span>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">First Name</label>
                  <input
                    className="field-input !h-12 !text-sm sm:!text-base !px-4 !bg-[#09090b] border border-white/10 text-white rounded-xl"
                    value={profile.firstName}
                    onChange={e => setProfile({...profile, firstName: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Last Name</label>
                  <input
                    className="field-input !h-12 !text-sm sm:!text-base !px-4 !bg-[#09090b] border border-white/10 text-white rounded-xl"
                    value={profile.lastName}
                    onChange={e => setProfile({...profile, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Email Address</label>
                <input
                  className="field-input !h-12 !text-sm sm:!text-base !px-4 !bg-[#09090b] border border-white/10 text-white rounded-xl"
                  value={profile.email}
                  onChange={e => setProfile({...profile, email: e.target.value})}
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  disabled={saving}
                  type="submit"
                  className="w-full sm:w-auto !bg-accent hover:!bg-accent/90 !text-white !py-3.5 !px-10 !font-bold !text-xs sm:!text-sm !rounded-xl shadow-lg shadow-accent/25 active:scale-95 transition-all uppercase tracking-wider"
                >
                  {saving ? 'SAVING...' : 'UPDATE PROFILE'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Social Links Section */}
        <div className="stack-gap-lg min-w-0">
          <Card className="primary compact-card p-4 sm:p-6 bg-[#0c0c0e]">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-4">Social Links</span>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">GitHub URL</label>
                <input
                  className="field-input !h-11 !text-sm !px-4 !bg-[#09090b] border border-white/10 text-white rounded-xl"
                  placeholder="https://github.com/username"
                  value={socials.github}
                  onChange={e => setSocials({...socials, github: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">LinkedIn URL</label>
                <input
                  className="field-input !h-11 !text-sm !px-4 !bg-[#09090b] border border-white/10 text-white rounded-xl"
                  placeholder="https://linkedin.com/in/username"
                  value={socials.linkedin}
                  onChange={e => setSocials({...socials, linkedin: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Portfolio Website</label>
                <input
                  className="field-input !h-11 !text-sm !px-4 !bg-[#09090b] border border-white/10 text-white rounded-xl"
                  placeholder="https://yourportfolio.com"
                  value={socials.portfolio}
                  onChange={e => setSocials({...socials, portfolio: e.target.value})}
                />
              </div>
            </div>
          </Card>

          <Card className="primary compact-card p-4 sm:p-6 border border-rose-500/20 bg-rose-950/10">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-2">Danger Zone</span>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-5">
              Deleting your account will permanently wipe all your logged tasks, habits, and reflections. This action cannot be undone.
            </p>
            <Button
              onClick={handleDeleteAccount}
              className="w-full sm:w-auto !bg-rose-500/10 !border !border-rose-500/30 !text-rose-400 hover:!bg-rose-500/20 !py-2.5 !px-5 !text-xs !font-bold !rounded-xl transition-all active:scale-95 uppercase tracking-wider"
            >
              DELETE ACCOUNT
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
