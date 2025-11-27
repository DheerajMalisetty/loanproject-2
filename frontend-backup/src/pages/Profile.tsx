import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        username: user.username || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      await axios.put(`${API_BASE_URL}/auth/profile`, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber
      });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been updated successfully.',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'destructive'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive'
      });
      return;
    }

    setPasswordLoading(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      await axios.put(`${API_BASE_URL}/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast({
        title: 'Password Changed',
        description: 'Your password has been changed successfully.',
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password. Please try again.';
      toast({
        title: 'Password Change Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-white text-2xl font-medium mx-auto mb-4">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="card-elevated p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="form-input"
                  placeholder="Enter first name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="form-input"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                className="form-input"
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input pl-10"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="form-input pl-10"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-accent-foreground">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Role: {user?.role?.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div className="card-elevated p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <LockClosedIcon className="h-6 w-6 text-secondary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="form-input"
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="form-input"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="form-input"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="text-sm text-warning-foreground">
                <p className="font-medium mb-1">Password Requirements:</p>
                <ul className="text-xs space-y-1">
                  <li>• At least 6 characters long</li>
                  <li>• Must not be the same as current password</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;