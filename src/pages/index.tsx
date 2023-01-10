/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GetStaticProps } from 'next';
import { useState } from 'react';

import { FiCalendar, FiUser } from 'react-icons/fi';

import Link from 'next/link';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import styles from './home.module.scss';

import { getPrismicClient } from '../services/prismic';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [test, setTest] = useState(false);

  function handleNextPosts() {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(data => {
        const newPosts = [...posts];

        data.results.map(post => {
          newPosts.push({
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          });
        });

        setPosts(newPosts);
        setTest(true);
      });
  }

  return (
    <main className={styles.container}>
      <ul>
        {posts.map(post => (
          <li className={styles.postContent} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <h2 className={styles.postTitle}>{post.data.title}</h2>
            </Link>
            <p>{post.data.subtitle}</p>
            <div>
              <span>
                <FiCalendar />
                {format(new Date(post.first_publication_date), 'dd MMM uuuu', {
                  locale: ptBR,
                })}
              </span>
              <span>
                <FiUser />
                {post.data.author}
              </span>
            </div>
          </li>
        ))}
        {postsPagination.next_page !== null && (
          <button type="button" onClick={handleNextPosts}>
            Carregar mais posts
          </button>
        )}
      </ul>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('post', {
    pageSize: 4,
  });

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results,
        next_page: postsResponse.next_page,
      },
    },
    revalidate: 60 * 60 * 2, // 2 hours
  };
};
