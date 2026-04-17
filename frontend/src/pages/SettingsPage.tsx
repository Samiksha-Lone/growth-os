import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { updateProfile, deleteProfile, uploadAvatar, fetchProfile } from '../api/growthos';
import { getFullAvatarUrl } from '../lib/utils';

export default function SettingsPage() {
  const { userName, userEmail, githubUrl, linkedinUrl, portfolioUrl, avatarUrl, updateUser, signOut } = useAuth();
  
  const [profile, setProfile] = useState({
    firstName: (userName?.split(' ')[0]) || 'User',
    lastName: (userName?.split(' ').slice(1).join(' ')) || '',
    email: userEmail || '',
    username: userEmail?.split('@')[0] || ''
  });
  
  const [socials, setSocials] = useState({
    github: githubUrl || '',
    linkedin: linkedinUrl || '',
    portfolio: portfolioUrl || ''
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        githubUrl: socials.github,
        linkedinUrl: socials.linkedin,
        portfolioUrl: socials.portfolio,
        avatarUrl: avatarUrl || ''
      });
      
      updateUser({
        userName: `${profile.firstName} ${profile.lastName}`,
        userEmail: profile.email,
        githubUrl: socials.github,
        linkedinUrl: socials.linkedin,
        portfolioUrl: socials.portfolio,
        avatarUrl: avatarUrl || ''
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
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>System Configuration</h2>
      </div>

      <div className="split-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Section */}
          <Card className="primary" style={{ padding: '24px' }}>
             <h3 className="card-title" style={{ marginBottom: '24px', fontSize: '0.9rem', color: '#555', textTransform: 'uppercase' }}>User Profile</h3>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #3a86ff, #06d6a0)', padding: '2px', overflow: 'hidden' }}>
                   <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', overflow: 'hidden' }}>
                      {avatarUrl ? (
                         <img src={getFullAvatarUrl(avatarUrl)!} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                         '👤'
                      )}
                   </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', fontSize: '0.8rem', padding: '6px 12px' }}
                   >
                      {uploading ? 'UPLOADING...' : 'UPLOAD PHOTO'}
                   </Button>
                   <span style={{ fontSize: '0.7rem', color: '#444' }}>PNG or JPG up to 1MB</span>
                </div>
             </div>

             <form onSubmit={handleSave}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="field-group">
                     <label className="field-label" style={{ color: '#555', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>First Name</label>
                     <input className="field-input" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', height: '38px', fontSize: '0.9rem' }} />
                  </div>
                  <div className="field-group">
                     <label className="field-label" style={{ color: '#555', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Last Name</label>
                     <input className="field-input" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', height: '38px', fontSize: '0.9rem' }} />
                  </div>
               </div>

               <div className="field-group" style={{ marginBottom: '16px' }}>
                  <label className="field-label" style={{ color: '#555', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Email Address</label>
                  <input className="field-input" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', height: '38px', fontSize: '0.9rem' }} />
               </div>

               <div className="field-group" style={{ marginBottom: '28px' }}>
                  <label className="field-label" style={{ color: '#555', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Username</label>
                  <input className="field-input" value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', height: '38px', fontSize: '0.9rem' }} />
               </div>

               <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                 <Button disabled={saving} type="submit" style={{ background: '#3a86ff', color: '#fff', border: 'none', padding: '10px 24px', fontWeight: 700, fontSize: '0.9rem' }}>
                   {saving ? 'Saving...' : 'COMMIT CHANGES'}
                 </Button>
               </div>
             </form>
          </Card>
        </div>

        {/* Social Links Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card className="primary compact-card">
             <h3 className="card-title" style={{ fontSize: '0.8rem', color: '#555', textTransform: 'uppercase', marginBottom: '16px' }}>Network Presence</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="field-group">
                   <label style={{ color: '#444', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>GITHUB</label>
                   <input className="field-input" value={socials.github} onChange={e => setSocials({...socials, github: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', height: '34px', fontSize: '0.85rem' }} />
                </div>
                <div className="field-group">
                   <label style={{ color: '#444', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>LINKEDIN</label>
                   <input className="field-input" value={socials.linkedin} onChange={e => setSocials({...socials, linkedin: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', height: '34px', fontSize: '0.85rem' }} />
                </div>
                <div className="field-group">
                   <label style={{ color: '#444', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px', display: 'block' }}>PORTFOLIO</label>
                   <input className="field-input" value={socials.portfolio} onChange={e => setSocials({...socials, portfolio: e.target.value})} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', height: '34px', fontSize: '0.85rem' }} />
                </div>
             </div>
          </Card>

          <Card className="primary compact-card" style={{ border: '1px solid rgba(239, 71, 111, 0.1)' }}>
             <h3 className="card-title" style={{ fontSize: '0.8rem', color: '#ef476f', textTransform: 'uppercase', marginBottom: '8px' }}>Security</h3>
             <p style={{ fontSize: '0.75rem', color: '#555', marginBottom: '16px', lineHeight: 1.4 }}>Permanent account deletion occurs immediately. This cannot be undone.</p>
             <Button onClick={handleDeleteAccount} style={{ background: 'transparent', border: '1px solid #ef476f20', color: '#ef476f', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}>DELETE ACCOUNT</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
