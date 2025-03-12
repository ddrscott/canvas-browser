export const useTheme = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (event) => {
      setTheme(event.matches ? 'dark' : 'light');
    };

    // Initial check
    handleThemeChange(mediaQuery);

    // Add listener
    mediaQuery.addEventListener('change', handleThemeChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return theme;
};
