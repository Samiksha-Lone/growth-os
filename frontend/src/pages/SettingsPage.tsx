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
      <div className="flex items-center justify-between">
        <h1 className="title-main">My Profile</h1>
      </div>

      <div className="split-layout">
        <div className="stack-gap-lg">
          {/* Profile Section */}
          <Card className="primary p-6">
             <span className="label-sub uppercase tracking-[2px]">My Profile</span>
             
             <div className="flex items-center gap-6 mb-8 mt-6 pb-8 border-b border-[#0a0a0a]">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-[#06d6a0] p-[3px] overflow-hidden flex-shrink-0 shadow-2xl">
                   <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center text-[2rem] overflow-hidden">
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
                <div className="stack-gap-md">
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
                      className="!bg-[#0f0f0f] !border !border-border !text-white !text-[0.7rem] !font-black !px-5 !py-2 !rounded-xl hover:bg-border transition-all"
                   >
                      {uploading ? 'UPLOADING...' : 'CHANGE PHOTO'}
                   </Button>
                   <span className="text-[0.6rem] text-secondary font-black uppercase tracking-widest">JPG/PNG MAX 1.0MB</span>
                </div>
             </div>

             <form onSubmit={handleSave} className="stack-gap-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                   <div className="stack-gap-sm">
                      <label className="label-sub ml-1 uppercase">First Name</label>
                      <input className="field-input !h-12 !text-[0.9rem] !px-4" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} />
                   </div>
                   <div className="stack-gap-sm">
                      <label className="label-sub ml-1 uppercase">Last Name</label>
                      <input className="field-input !h-12 !text-[0.9rem] !px-4" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} />
                   </div>
                </div>

                <div className="stack-gap-sm">
                   <label className="label-sub ml-1 uppercase">Email Address</label>
                   <input className="field-input !h-12 !text-[0.9rem] !px-4" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
                </div>

                <div className="flex justify-end mt-6">
                  <Button disabled={saving} type="submit" className="!bg-accent !text-white !border-none !py-3.5 !px-12 !font-black !text-[0.8rem] !rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
                    {saving ? 'SAVING...' : 'UPDATE PROFILE'}
                  </Button>
                </div>
             </form>
          </Card>
        </div>

        {/* Social Links Section */}
        <div className="stack-gap-lg">
          <Card className="primary compact-card p-6">
             <span className="label-sub uppercase tracking-[2px]">Social Links</span>
             <div className="stack-gap-md mt-6">
                <div className="stack-gap-sm">
                   <label className="text-secondary/40 text-[0.65rem] font-black uppercase tracking-widest ml-1">Github</label>
                   <input className="field-input !h-10 !text-[0.85rem] !px-4" value={socials.github} onChange={e => setSocials({...socials, github: e.target.value})} />
                </div>
                <div className="stack-gap-sm">
                   <label className="text-secondary/40 text-[0.65rem] font-black uppercase tracking-widest ml-1">Linkedin</label>
                   <input className="field-input !h-10 !text-[0.85rem] !px-4" value={socials.linkedin} onChange={e => setSocials({...socials, linkedin: e.target.value})} />
                </div>
                <div className="stack-gap-sm">
                   <label className="text-secondary/40 text-[0.65rem] font-black uppercase tracking-widest ml-1">Portfolio</label>
                   <input className="field-input !h-10 !text-[0.85rem] !px-4" value={socials.portfolio} onChange={e => setSocials({...socials, portfolio: e.target.value})} />
                </div>
             </div>
          </Card>

          <Card className="primary compact-card p-6 border border-[#ef476f]/10 shadow-[0_0_20px_rgba(239,71,111,0.02)] bg-[#ef476f]/[0.01]">
             <span className="label-sub !text-[#ef476f] uppercase tracking-[2px]">Danger Zone</span>
             <p className="text-[0.75rem] text-secondary font-bold mt-4 mb-6 leading-relaxed italic opacity-60">Deleting your account will remove all your data forever. This action cannot be undone.</p>
             <Button onClick={handleDeleteAccount} className="!bg-transparent !border !border-[#ef476f]/20 !text-[#ef476f] !py-2.5 !px-6 !text-[0.65rem] !font-black !rounded-xl hover:!bg-[#ef476f]/05 transition-all active:scale-95 uppercase tracking-widest">DELETE ACCOUNT</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
