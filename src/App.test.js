import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-webcam', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      getScreenshot: () => 'data:image/jpeg;base64,cGhvdG8=',
    }));
    React.useEffect(() => {
      props.onUserMedia();
    }, []);
    return <video aria-label="Live camera preview" />;
  });
});

test('fills the four-photo strip in order and redo clears it', async () => {
  render(<App />);
  const captureButton = await screen.findByRole('button', { name: /take a picture/i });
  expect(captureButton).toBeEnabled();
  const downloadButton = screen.getByRole('button', { name: /download jpeg/i });

  expect(screen.getAllByText(/photo.*left to finish your strip/i)).toHaveLength(1);
  expect(downloadButton).toBeDisabled();
  for (let index = 1; index <= 4; index += 1) {
    fireEvent.click(captureButton);
    expect(screen.getByRole('img', { name: `Captured portrait ${index}` })).toBeInTheDocument();
  }

  expect(screen.getByText('OF 04').parentElement).toHaveTextContent('04 OF 04');
  expect(captureButton).toBeDisabled();
  expect(downloadButton).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: /redo strip and remove all photos/i }));
  expect(screen.queryByRole('img', { name: /captured portrait/i })).not.toBeInTheDocument();
  expect(captureButton).toBeEnabled();
  expect(downloadButton).toBeDisabled();
});

test('downloads a composed JPEG strip after four captures', async () => {
  const originalImage = window.Image;
  const canvasContext = {
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    ellipse: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
  };
  const canvasContextSpy = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext);
  const toBlobSpy = jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
    callback(new Blob(['jpeg'], { type: 'image/jpeg' }));
  });
  const anchorClickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:photo-strip') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  window.Image = class {
    width = 640;
    height = 480;
    naturalWidth = 317;
    naturalHeight = 788;

    set src(value) {
      this.onload();
    }
  };

  render(<App />);
  const captureButton = await screen.findByRole('button', { name: /take a picture/i });
  for (let index = 0; index < 4; index += 1) fireEvent.click(captureButton);
  fireEvent.click(screen.getByRole('button', { name: /download jpeg/i }));

  await screen.findByText('Your keepsake is ready to download.');
  expect(canvasContext.drawImage).toHaveBeenCalledTimes(5);
  expect(toBlobSpy).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.94);
  expect(anchorClickSpy).toHaveBeenCalledTimes(1);

  window.Image = originalImage;
  canvasContextSpy.mockRestore();
  toBlobSpy.mockRestore();
  anchorClickSpy.mockRestore();
});
