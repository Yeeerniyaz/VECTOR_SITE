import React, { useEffect, useState } from 'react';
import { MantineProvider, Box, Text, Stack, Group, createTheme, rem } from '@mantine/core';
import '@mantine/core/styles.css';

const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
});

// Полный и точный список праздников РК
const getRKHoliday = (date) => {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const key = `${d}.${m}`;
  
  const holidays = {
    '1.1': 'НОВЫЙ ГОД', '2.1': 'НОВЫЙ ГОД',
    '7.1': 'РОЖДЕСТВО',
    '8.3': '8 МАРТА',
    '21.3': 'НАУРЫЗ', '22.3': 'НАУРЫЗ', '23.3': 'НАУРЫЗ',
    '1.5': 'ДЕНЬ ЕДИНСТВА',
    '7.5': 'ДЕНЬ ЗАЩИТНИКА',
    '9.5': 'ДЕНЬ ПОБЕДЫ',
    '6.7': 'ДЕНЬ СТОЛИЦЫ',
    '30.8': 'ДЕНЬ КОНСТИТУЦИИ',
    '25.10': 'ДЕНЬ РЕСПУБЛИКИ',
    '16.12': 'ДЕНЬ НЕЗАВИСИМОСТИ'
  };
  return holidays[key] || '';
};

const VectorClient = () => {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [news, setNews] = useState([]);
  const [newsIdx, setNewsIdx] = useState(0);

  useEffect(() => {
    // Часы
    const t = setInterval(() => setTime(new Date()), 1000);
    
    // Погода (Алматы)
    navigator.geolocation.getCurrentPosition(p => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&current=temperature_2m&timezone=auto`)
        .then(r => r.json()).then(d => setWeather(d.current));
    });

    // Новости (Tengrinews через стабильный прокси)
    const fetchNews = async () => {
      try {
        const r = await fetch(`https://corsproxy.io/?https://tengrinews.kz/news.rss`);
        const text = await r.text();
        const items = Array.from(new DOMParser().parseFromString(text, "text/xml").querySelectorAll("item")).map(i => i.querySelector("title").textContent);
        setNews(items);
      } catch (e) { setNews([]); } // Если ошибка, просто пустота, чтобы не раздражать клиента
    };
    fetchNews();
    
    // Ротация новостей
    const ni = setInterval(() => setNewsIdx(p => p + 1), 15000);

    return () => { clearInterval(t); clearInterval(ni); };
  }, []);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <style dangerouslySetInnerHTML={{ __html: `
        html, body, #root { 
          margin: 0 !important; padding: 0 !important; 
          width: 100vw; height: 100vh; 
          background: #000 !important; overflow: hidden; 
          color: #fff; cursor: none; 
        }
      `}} />

      <Box style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        padding: rem(60), // Отступы как в MagicMirror
        boxSizing: 'border-box' 
      }}>
        
        {/* ВЕРХНЯЯ ЧАСТЬ (Top Bar) */}
        <Group justify="space-between" align="flex-start">
          
          {/* СЛЕВА: Время и Дата */}
          <Stack gap={0}>
            {/* Часы - главный элемент */}
            <Text style={{ fontSize: rem(90), fontWeight: 200, lineHeight: 1, letterSpacing: rem(-4) }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            
            {/* Дата - аккуратно под часами */}
            <Text size={rem(20)} fw={400} opacity={0.6} mt={rem(5)} style={{ textTransform: 'uppercase', letterSpacing: rem(2) }}>
              {time.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>

            {/* Праздник - появляется только в нужный день (Оранжевый акцент) */}
            {getRKHoliday(time) && (
              <Group gap={rem(10)} mt={rem(15)}>
                <Box w={4} h={24} bg="#FF8C00" /> {/* Оранжевая полоска Vector */}
                <Text size={rem(18)} fw={600} style={{ color: '#FF8C00', letterSpacing: rem(1) }}>
                  {getRKHoliday(time)}
                </Text>
              </Group>
            )}
          </Stack>

          {/* СПРАВА: Погода */}
          <Stack align="flex-end" gap={0}>
            {weather ? (
              <Group gap={rem(15)} align="flex-start">
                 {/* Температура - крупно и оранжевым */}
                <Text style={{ fontSize: rem(80), fontWeight: 200, lineHeight: 1, color: '#FF8C00' }}>
                  {Math.round(weather.temperature_2m)}°
                </Text>
              </Group>
            ) : <Text opacity={0.2}>--</Text>}
            
            <Text size={rem(18)} fw={400} opacity={0.6} style={{ letterSpacing: rem(2), marginTop: rem(5) }}>
              АЛМАТЫ
            </Text>
          </Stack>
        </Group>

        {/* НИЖНЯЯ ЧАСТЬ (Bottom Bar) */}
        <Stack gap="xl">
          {/* Линия разделителя (очень тонкая) */}
          <Box w="100%" h={1} bg="rgba(255,255,255,0.1)" />

          <Group justify="space-between" align="flex-end">
            {/* Блок новостей */}
            <Box style={{ maxWidth: '70%' }}>
              <Text size="xs" fw={700} style={{ color: '#FF8C00', letterSpacing: rem(2), marginBottom: rem(5) }}>
                TENGRI NEWS
              </Text>
              <Text size={rem(22)} fw={300} style={{ lineHeight: 1.3, minHeight: rem(60) }}>
                {news.length > 0 ? news[newsIdx % news.length] : "Загрузка ленты..."}
              </Text>
            </Box>

            {/* Брендинг (очень скромный) */}
            <Stack gap={0} align="flex-end" style={{ opacity: 0.3 }}>
              <Text size="xs" fw={600} style={{ letterSpacing: rem(3) }}>VECTOR</Text>
              <Text size="xs" fw={400}>EDITION</Text>
            </Stack>
          </Group>
        </Stack>

      </Box>
    </MantineProvider>
  );
};

export default VectorClient;