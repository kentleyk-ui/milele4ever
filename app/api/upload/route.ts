import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const memorialId = formData.get('memorialId') as string
    const postId = formData.get('postId') as string | null
    const caption = formData.get('caption') as string | null
    const takenAt = formData.get('takenAt') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determine media type
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'

    // Upload to Vercel Blob (private store)
    const blob = await put(`milele/${user.id}/${Date.now()}-${file.name}`, file, {
      access: 'private',
    })

    // Save to database
    const { data: media, error } = await supabase
      .from('media')
      .insert({
        memorial_id: memorialId,
        post_id: postId || null,
        uploaded_by: user.id,
        url: blob.pathname,
        media_type: mediaType,
        caption: caption || null,
        taken_at: takenAt || null,
        file_size: file.size,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      media,
      pathname: blob.pathname 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
