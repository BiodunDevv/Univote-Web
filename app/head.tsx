export default function Head() {
  return (
    <>
      <link rel="manifest" href="/student-portal.webmanifest" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="shortcut icon" href="/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Univote" />
      <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
    </>
  );
}
