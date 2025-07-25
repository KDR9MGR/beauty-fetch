
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function BlogPreview() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Beauty Blog</h2>
          <Link to="/blog">
            <Button variant="outline">View All Posts</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article 
              key={post.title}
              className="beauty-card group"
            >
              <div className="aspect-[16/9] relative overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="inline-block text-xs font-medium text-white bg-beauty-purple/90 rounded-full px-3 py-1">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <Link to={post.href}>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-beauty-purple">{post.title}</h3>
                </Link>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="h-8 w-8 rounded-full mr-2 object-cover"
                    />
                    <span className="text-sm">{post.author.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{post.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const blogPosts = [
  {
    title: "10 Skincare Myths Debunked by Dermatologists",
    excerpt: "We asked top dermatologists to clear up common misconceptions about skincare routines and products.",
    href: "/blog/skincare-myths-debunked",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "Skincare",
    date: "Jun 15, 2023",
    author: {
      name: "Dr. Emma Reed",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg"
    }
  },
  {
    title: "The Ultimate Guide to Clean Beauty",
    excerpt: "Everything you need to know about clean beauty products, ingredients to avoid, and trusted brands.",
    href: "/blog/clean-beauty-guide",
    image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "Clean Beauty",
    date: "May 28, 2023",
    author: {
      name: "Sophia Wang",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    }
  },
  {
    title: "Summer Makeup Trends You Need to Try",
    excerpt: "From dewy skin to bold colors, these are the makeup trends taking over this summer season.",
    href: "/blog/summer-makeup-trends",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    category: "Makeup",
    date: "Apr 12, 2023",
    author: {
      name: "Alex Rivera",
      avatar: "https://randomuser.me/api/portraits/women/66.jpg"
    }
  }
];
