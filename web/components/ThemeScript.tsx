// Inline w <head>: ustawia motyw przed pierwszym malowaniem (bez "flash").
// Brak zapisanego wyboru → CSS używa prefers-color-scheme.
const script = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
