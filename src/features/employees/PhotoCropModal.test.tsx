import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PhotoCropModal from './PhotoCropModal'

const FAKE_FILE = new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' })

const mockRemoveBackground = vi.fn()
vi.mock('@imgly/background-removal', () => ({
  removeBackground: (...args: unknown[]) => mockRemoveBackground(...args),
}))

describe('PhotoCropModal', () => {
  beforeEach(() => {
    mockRemoveBackground.mockReset()
  })

  it('confirms with the current crop and the original file when "اعتماد الصورة" is clicked', () => {
    const onConfirm = vi.fn()
    render(<PhotoCropModal file={FAKE_FILE} onConfirm={onConfirm} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'اعتماد الصورة' }))

    expect(onConfirm).toHaveBeenCalledWith({ scale: 1, offsetX: 50, offsetY: 50 }, FAKE_FILE)
    expect(mockRemoveBackground).not.toHaveBeenCalled()
  })

  it('confirms with an updated scale after moving the zoom slider', () => {
    const onConfirm = vi.fn()
    render(<PhotoCropModal file={FAKE_FILE} onConfirm={onConfirm} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('التكبير'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'اعتماد الصورة' }))

    expect(onConfirm).toHaveBeenCalledWith({ scale: 2, offsetX: 50, offsetY: 50 }, FAKE_FILE)
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
    expect(onConfirm).toHaveBeenCalledWith({ scale: 1.5, offsetX: 30, offsetY: 70 }, FAKE_FILE)
  })

  describe('remove background option', () => {
    it('runs background removal and confirms with a transparent PNG when checked', async () => {
      const resultBlob = new Blob(['fake-png-bytes'], { type: 'image/png' })
      mockRemoveBackground.mockResolvedValue(resultBlob)
      const onConfirm = vi.fn()

      render(<PhotoCropModal file={FAKE_FILE} onConfirm={onConfirm} onCancel={vi.fn()} />)

      fireEvent.click(screen.getByLabelText('إزالة خلفية الصورة'))
      fireEvent.click(screen.getByRole('button', { name: 'اعتماد الصورة' }))

      await waitFor(() => expect(onConfirm).toHaveBeenCalled())

      expect(mockRemoveBackground).toHaveBeenCalledWith(FAKE_FILE, expect.any(Object))
      const [crop, resultFile] = onConfirm.mock.calls[0]
      expect(crop).toEqual({ scale: 1, offsetX: 50, offsetY: 50 })
      expect(resultFile).toBeInstanceOf(File)
      expect(resultFile.type).toBe('image/png')
    })

    it('shows an error and does not confirm if background removal fails', async () => {
      mockRemoveBackground.mockRejectedValue(new Error('model failed to load'))
      const onConfirm = vi.fn()

      render(<PhotoCropModal file={FAKE_FILE} onConfirm={onConfirm} onCancel={vi.fn()} />)

      fireEvent.click(screen.getByLabelText('إزالة خلفية الصورة'))
      fireEvent.click(screen.getByRole('button', { name: 'اعتماد الصورة' }))

      expect(
        await screen.findByText('تعذرت إزالة الخلفية، يرجى المحاولة مرة أخرى أو إلغاء تحديد الخيار'),
      ).toBeInTheDocument()
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })
})
