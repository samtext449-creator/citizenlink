'use client'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">
          Configure your admin portal preferences, notifications, and integrations.
        </p>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Admin profile, password, and contact details.
          </p>
        </div>

        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500 mt-1">
            KRA, M-Pesa, and Supabase configuration.
          </p>
        </div>
      </div>
    </div>
  )
}