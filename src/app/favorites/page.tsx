import Gallery from "@/components/Gallery";

export default function FavoritesPage() {
  return (
    <Gallery
      title="Favorites"
      favoritesOnly
      emptyHint="Nothing favorited yet — star an inspiration to save it here."
    />
  );
}
