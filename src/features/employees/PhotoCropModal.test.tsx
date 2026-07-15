import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhotoCropModal from './PhotoCropModal'

const FAKE_FILE = new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' })

describe('PhotoCropModal', () => {
  it('confirms with the current crop when "اعتماد الصورة" is clicked', () => {
    const onConfirm = vi.fn()
    render(<PhotoCropModal file={FAKE_FILE} onConfirm={onConfirm} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'اعتماد الصورة' }))

    expect(onConfirm).toHaveBeenCalledWith({ scale: 1, offsetX: 50, offsetY: 50 })
  })

  it('confirms with an updated scale after moving the zoom slider', () => {
    const onConfirm = vi.fn()
    render(<PhotoCropModal file={FAKE_FILE} onConfirm={onConfirm} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('التكبير'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'اعتماد الصورة' }))

    expect(onConfirm).toHaveBeenCalledWith({ scale: 2, offsetX: 50, offsetY: 50 })
  })

  it('calls onCancel without confirming when "إلغاء" is clicked', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<PhotoCropModal file={FAKE_FILE} onConfirm={onConfirm} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))

    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('starts from a previously saved crop when provided', () => {
    const onConfirm = vi.fn()
    render(
      <PhotoCropModal
        file={FAKE_FILE}
        initialCrop={{ scale: 1.5, offsetX: 30, offsetY: 70 }}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    expect((screen.getByLabelText('التكبير') as HTMLInputElement).value).toBe('1.5')
    fireEvent.click(screen.getByRole('button', { name: 'اعتماد الصورة' }))
    expect(onConfirm).toHaveBeenCalledWith({ scale: 1.5, offsetX: 30, offsetY: 70 })
  })
})
