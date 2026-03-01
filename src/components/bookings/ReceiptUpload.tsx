import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface ReceiptUploadProps {
  bookingId: string
  onUploaded: (url: string) => void
  disabled?: boolean
}

export function ReceiptUpload({ bookingId, onUploaded, disabled }: ReceiptUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${bookingId}/receipt.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('booking-receipts')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('booking-receipts')
        .getPublicUrl(path)

      setPreviewUrl(publicUrl)
      onUploaded(publicUrl)
    } catch (err) {
      console.error('Receipt upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      {previewUrl && (
        <div className="mb-2 inline-block overflow-hidden rounded-lg border border-stone-200 bg-white">
          <img
            src={previewUrl}
            alt="Payment receipt"
            className="max-h-40 max-w-full object-contain"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || uploading}
        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            Uploading...
          </span>
        ) : previewUrl ? (
          'Change Receipt'
        ) : (
          'Upload Receipt'
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
