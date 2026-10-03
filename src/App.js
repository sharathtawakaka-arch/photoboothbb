import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import './App.css';

const STRIP_LENGTH = 4;
const STRIP_FRAME_PATH = `${process.env.PUBLIC_URL}/assets/strip_no%20background.png`;
const STRIP_WINDOWS = [
  { top: 13.5, height: 16.8 },
  { top: 32.6, height: 16.6 },
  { top: 51.5, height: 16.8 },
  { top: 70.7, height: 16.9 },
];

const loadPhoto = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = source;
});

function App() {
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [photos, setPhotos] = useState([]);

  const capturePhoto = () => {
    if (photos.length >= STRIP_LENGTH) return;
    const image = webcamRef.current?.getScreenshot();
    if (image) {
      setPhotos((currentPhotos) => currentPhotos.length >= STRIP_LENGTH
        ? currentPhotos
        : [...currentPhotos, { id: `${Date.now()}-${currentPhotos.length}`, image }]);
    }
  };

  const retryCamera = () => {
    setCameraReady(false);
    setCameraError('');
    setCameraAttempt((attempt) => attempt + 1);
  };

  const redoStrip = () => setPhotos([]);

  const downloadStrip = async () => {
    if (photos.length !== STRIP_LENGTH) return;

    const [images, stripFrame] = await Promise.all([
      Promise.all(photos.map((photo) => loadPhoto(photo.image))),
      loadPhoto(STRIP_FRAME_PATH),
    ]);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const scaleFactor = 2;
    const frameWidth = stripFrame.naturalWidth;
    const frameHeight = stripFrame.naturalHeight;
    canvas.width = frameWidth * scaleFactor;
    canvas.height = frameHeight * scaleFactor;
    context.fillStyle = '#fffaf5';
    context.fillRect(0, 0, canvas.width, canvas.height);

    images.forEach((image, index) => {
      const window = STRIP_WINDOWS[index];
      const targetX = frameWidth * 0.341 * scaleFactor;
      const targetY = frameHeight * (window.top / 100) * scaleFactor;
      const targetWidth = frameWidth * 0.315 * scaleFactor;
      const targetHeight = frameHeight * (window.height / 100) * scaleFactor;
      const scale = Math.max(targetWidth / image.width, targetHeight / image.height);
      const cropWidth = targetWidth / scale;
      const cropHeight = targetHeight / scale;
      const sourceX = (image.width - cropWidth) / 2;
      const sourceY = (image.height - cropHeight) / 2;
      context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, targetX, targetY, targetWidth, targetHeight);
    });
    context.drawImage(stripFrame, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'stillroom-photo-strip.jpg';
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.94);
  };

  return (
    <main className="booth-app">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Stillroom home">
          <span className="wordmark-mark" aria-hidden="true">S ♡</span>
          <span>BABY's PHOTOBOOTH</span>
        </a>
        <div className="topbar-note"><span aria-hidden="true">♥</span> smile i'm always behind your... hehe</div>
        <div className="session-number">BABY's PHOTOBOOTH <span>♡</span></div>
      </header>

      <section className="booth-layout" aria-labelledby="booth-title">
        <div className="booth-heading">
          <div>
            <p className="eyebrow"><span aria-hidden="true">✿</span> YOUR PHOTOBOOTH BABY GURL </p>
            <h1 id="booth-title">Hello babycakes,<br /><em>Smile for the camera.</em></h1>
          </div>
          <div className="camera-status" aria-live="polite">
            <span className={`status-dot ${cameraReady ? 'is-live' : ''}`} />
            {cameraReady ? 'Ready when you are' : cameraError ? 'Camera needs a little help' : 'Waking up the camera'}
          </div>
        </div>

        <div className="booth-workspace">
          <div className="camera-column">
          <div className="capture-frame" aria-label="Floral wooden portrait frame">
          <div className={`camera-frame ${cameraReady ? 'camera-frame-ready' : ''}`}>
            {cameraError ? (
              <div className="camera-message">
                <div className="camera-message-icon" aria-hidden="true">♡</div>
                <h2>Let’s get you in the picture</h2>
                <p>{cameraError}</p>
                <button className="retry-button" onClick={retryCamera}>Try camera again <span aria-hidden="true">↗</span></button>
              </div>
            ) : (
              <>
                <Webcam
                  key={cameraAttempt}
                  ref={webcamRef}
                  className="webcam-video"
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.92}
                  videoConstraints={{ facingMode: 'user' }}
                  onUserMedia={() => {
                    setCameraReady(true);
                    setCameraError('');
                  }}
                  onUserMediaError={(error) => {
                    setCameraReady(false);
                    setCameraError(
                      error?.name === 'NotAllowedError'
                        ? 'Allow camera access in your browser, then try again.'
                        : 'Check that a camera is connected and not being used by another app.'
                    );
                  }}
                />
                {!cameraReady && (
                  <div className="camera-loading" aria-live="polite">
                    <span className="loading-ring" />
                    <span>Getting the camera ready</span>
                    <small>Your browser may ask for permission</small>
                  </div>
                )}
                {cameraReady && <span className="live-label"><span /> LIVE</span>}
              </>
            )}
          </div>
          <img className="capture-frame-art" src={`${process.env.PUBLIC_URL}/assets/frame%20no%20background.png`} alt="" aria-hidden="true" />
          </div>
          <div className="capture-bar">
            <p>{cameraReady ? `${Math.max(0, STRIP_LENGTH - photos.length)} little ${STRIP_LENGTH - photos.length === 1 ? 'moment' : 'moments'} left` : 'Camera access needed'}</p>
            <button className="capture-button" onClick={capturePhoto} disabled={!cameraReady || photos.length >= STRIP_LENGTH} aria-label="Take a picture">
              <span className="shutter-ring"><span /></span>
              <span className="capture-label">{photos.length >= STRIP_LENGTH ? 'STRIP COMPLETE' : 'TAKE A PHOTO'}</span>
            </button>
            <p className="capture-count">{String(photos.length).padStart(2, '0')} <span>OF 04</span></p>
          </div>
        </div>
          <aside className="photo-strip" aria-label="Four-photo strip">
            <div className="strip-heading">
              <div><span className="strip-kicker">A KEEPSAKE</span><h2>Your photo strip</h2></div>
              <span className="strip-heart" aria-hidden="true">♡</span>
            </div>
            <div className="strip-paper">
              <div className="photo-list">
                {Array.from({ length: STRIP_LENGTH }, (_, index) => {
                  const photo = photos[index];
                  const window = STRIP_WINDOWS[index];
                  return (
                    <div
                      className={`captured-photo ${photo ? 'has-photo' : ''}`}
                      key={photo?.id || `empty-${index}`}
                      style={{ top: `${window.top}%`, height: `${window.height}%` }}
                    >
                      {photo ? <img src={photo.image} alt={`Captured portrait ${index + 1}`} /> : <span className="photo-placeholder">{index === 0 ? 'your smile goes here' : '♡'}</span>}
                    </div>
                  );
                })}
              </div>
              <img className="strip-frame-art" src={STRIP_FRAME_PATH} alt="" aria-hidden="true" />
            </div>
            <div className="strip-actions">
              <button className="redo-button" onClick={redoStrip} disabled={!photos.length} aria-label="Redo strip and remove all photos">
                <span aria-hidden="true">↺</span> Start over
              </button>
              <button className="download-button" onClick={downloadStrip} disabled={photos.length !== STRIP_LENGTH}>
                <span aria-hidden="true">↓</span> Download JPEG
              </button>
            </div>
            <p className="strip-hint" aria-live="polite">{photos.length === STRIP_LENGTH ? 'Your keepsake is ready to download.' : `${STRIP_LENGTH - photos.length} ${STRIP_LENGTH - photos.length === 1 ? 'photo' : 'photos'} left to finish your strip`}</p>
          </aside>
        </div>
      </section>
      <footer className="page-footer"><span>YOUR PHOTOBOOTH <span aria-hidden="true">♥</span></span><span>MADE WITH A LOTS OF LOVE</span></footer>
    </main>
  );
}

export default App;
