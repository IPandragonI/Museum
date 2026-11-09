/**
 * Famous artists that may be offered as WRONG answers in "Who Is the Artist?", even when none of their works is in
 * the collection. This widens the pool of plausible distractors (a Vermeer question can offer Pieter de Hooch,
 * a Munch question Egon Schiele…). Each entry is only a name and a birth year used to pick people of the same era;
 * no claim is made about any artwork. An entry is never offered next to the real creator or a spelling variant of it.
 */
export interface ReferenceArtist {
  name: string;
  born: number;
}

export const REFERENCE_ARTISTS: ReferenceArtist[] = [
  { name: "Giotto", born: 1267 }, { name: "Fra Angelico", born: 1395 }, { name: "Masaccio", born: 1401 }, { name: "Jan van Eyck", born: 1390 }, { name: "Rogier van der Weyden", born: 1400 },
  { name: "Piero della Francesca", born: 1415 }, { name: "Andrea Mantegna", born: 1431 }, { name: "Giovanni Bellini", born: 1430 }, { name: "Hans Memling", born: 1430 }, { name: "Sandro Botticelli", born: 1445 },
  { name: "Pietro Perugino", born: 1446 }, { name: "Hieronymus Bosch", born: 1450 }, { name: "Leonardo da Vinci", born: 1452 }, { name: "Albrecht Dürer", born: 1471 }, { name: "Lucas Cranach the Elder", born: 1472 },
  { name: "Michelangelo", born: 1475 }, { name: "Giorgione", born: 1477 }, { name: "Hans Holbein the Younger", born: 1497 }, { name: "Pieter Bruegel the Elder", born: 1525 }, { name: "Tintoretto", born: 1518 },
  { name: "Paolo Veronese", born: 1528 }, { name: "Sofonisba Anguissola", born: 1532 }, { name: "El Greco", born: 1541 }, { name: "Peter Paul Rubens", born: 1577 }, { name: "Caravaggio", born: 1571 },
  { name: "Artemisia Gentileschi", born: 1593 }, { name: "Georges de La Tour", born: 1593 }, { name: "Nicolas Poussin", born: 1594 }, { name: "Anthony van Dyck", born: 1599 }, { name: "Diego Velázquez", born: 1599 },
  { name: "Claude Lorrain", born: 1600 }, { name: "Gerard ter Borch", born: 1617 }, { name: "Bartolomé Esteban Murillo", born: 1617 }, { name: "Jan Steen", born: 1626 }, { name: "Pieter de Hooch", born: 1629 },
  { name: "Jacob van Ruisdael", born: 1629 }, { name: "Jean-Antoine Watteau", born: 1684 }, { name: "Canaletto", born: 1697 }, { name: "William Hogarth", born: 1697 }, { name: "Jean-Baptiste-Siméon Chardin", born: 1699 },
  { name: "François Boucher", born: 1703 }, { name: "Joshua Reynolds", born: 1723 }, { name: "Thomas Gainsborough", born: 1727 }, { name: "Joseph Wright of Derby", born: 1734 }, { name: "Jean-Honoré Fragonard", born: 1732 },
  { name: "Angelica Kauffman", born: 1741 }, { name: "Jacques-Louis David", born: 1748 }, { name: "Kitagawa Utamaro", born: 1753 }, { name: "Élisabeth Vigée Le Brun", born: 1755 }, { name: "William Blake", born: 1757 },
  { name: "Katsushika Hokusai", born: 1760 }, { name: "Caspar David Friedrich", born: 1774 }, { name: "Jean-Auguste-Dominique Ingres", born: 1780 }, { name: "Théodore Géricault", born: 1791 }, { name: "Camille Corot", born: 1796 },
  { name: "Utagawa Hiroshige", born: 1797 }, { name: "Eugène Delacroix", born: 1798 }, { name: "Thomas Cole", born: 1801 }, { name: "Honoré Daumier", born: 1808 }, { name: "Jean-François Millet", born: 1814 },
  { name: "Gustave Courbet", born: 1819 }, { name: "Rosa Bonheur", born: 1822 }, { name: "Jean-Léon Gérôme", born: 1824 }, { name: "Pierre Puvis de Chavannes", born: 1824 }, { name: "William-Adolphe Bouguereau", born: 1825 },
  { name: "Gustave Moreau", born: 1826 }, { name: "Frederic Edwin Church", born: 1826 }, { name: "John Everett Millais", born: 1829 }, { name: "Dante Gabriel Rossetti", born: 1828 }, { name: "Camille Pissarro", born: 1830 },
  { name: "Albert Bierstadt", born: 1830 }, { name: "Edward Burne-Jones", born: 1833 }, { name: "James McNeill Whistler", born: 1834 }, { name: "Winslow Homer", born: 1836 }, { name: "Alfred Sisley", born: 1839 },
  { name: "Pierre-Auguste Renoir", born: 1841 }, { name: "Berthe Morisot", born: 1841 }, { name: "Odilon Redon", born: 1840 }, { name: "Mary Cassatt", born: 1844 }, { name: "Henri Rousseau", born: 1844 },
  { name: "Ilya Repin", born: 1844 }, { name: "Thomas Eakins", born: 1844 }, { name: "Paul Gauguin", born: 1848 }, { name: "Vincent van Gogh", born: 1853 }, { name: "Ferdinand Hodler", born: 1853 },
  { name: "John Singer Sargent", born: 1856 }, { name: "Georges Seurat", born: 1859 }, { name: "Joaquín Sorolla", born: 1863 }, { name: "Henri de Toulouse-Lautrec", born: 1864 }, { name: "Paul Signac", born: 1863 },
  { name: "Wassily Kandinsky", born: 1866 }, { name: "Henri Matisse", born: 1869 }, { name: "Piet Mondrian", born: 1872 }, { name: "Paula Modersohn-Becker", born: 1876 }, { name: "Paul Klee", born: 1879 },
  { name: "Kazimir Malevich", born: 1879 }, { name: "Pablo Picasso", born: 1881 }, { name: "Edward Hopper", born: 1882 }, { name: "Georges Braque", born: 1882 }, { name: "Amedeo Modigliani", born: 1884 },
  { name: "Oskar Kokoschka", born: 1886 }, { name: "Diego Rivera", born: 1886 }, { name: "Marc Chagall", born: 1887 }, { name: "Georgia O’Keeffe", born: 1887 }, { name: "Giorgio de Chirico", born: 1888 },
  { name: "Egon Schiele", born: 1890 }, { name: "Max Ernst", born: 1891 }, { name: "Joan Miró", born: 1893 }, { name: "René Magritte", born: 1898 }, { name: "Salvador Dalí", born: 1904 },
  { name: "Frida Kahlo", born: 1907 }, { name: "Jackson Pollock", born: 1912 }, { name: "Mark Rothko", born: 1903 },
];
