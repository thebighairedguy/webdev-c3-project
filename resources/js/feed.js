const cur_user_id = parseInt(document.getElementById("user_id_field").value);

const Form = (props) => {
  const [content, setContent] = React.useState("");

  const post = (e) => {
    e.preventDefault();
    $.post("/post/new", { content: content }, function (data) {
      if (data == "Created") {
        props.reloadFunction((cur) => !cur);
        //alert("Post successfully created.");
        setContent("");
      } else alert("Error while posting.");
    });
  };

  return (
    <section className="mt-8 w-3/4 m-auto bg-white p-12 pt-10 rounded-md">
      <h2 className="text-2xl font-bold mb-2">Create a Post</h2>
      <form action="/post/new" method="POST" id="post-form" onSubmit={post} className="flex flex-row">
        <textarea
          name="content"
          placeholder="What's on your mind?"
          id="post-content-field"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
          }}
          className="border-2 px-3 py-2 w-full"
        ></textarea>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 min-w-max">
          <i className="fa-solid fa-paper-plane mr-2"></i>Post
        </button>
      </form>
    </section>
  );
};

const Posts = () => {
  const [posts, setPosts] = React.useState([]);
  const [reload, setReload] = React.useState("true");

  React.useEffect(() => {
    fetch("/post/all")
      .then((data) => {
        data.json().then((final_data) => {
          //console.log(final_data);
          setPosts(final_data); /* setState NOT CHANGING STATE*/
          //console.log(posts);
        });
      })
      .catch(() => {
        console.log(err);
      });
  }, [reload]);

  return (
    <div>
      <Form reloadFunction={setReload} />
      {posts.map((post, index) => {
        return (
          <div
            className="mt-8 w-8/12 m-auto bg-white p-12 pt-10 rounded-md flex flex-row gap-x-4 items-center"
            key={index}
          >
            <i className="fa-solid fa-circle-user text-8xl"></i>
            <div className="w-full">
              <div className="flex flex-row justify-between">
                <h3 className="text-large font-medium">{post.name}</h3>
                <span className="text-gray-400 text-small">{post.date_posted}</span>
              </div>
              <p>{post.content}</p>
              {cur_user_id == post.user_id && (
                <form action="/post/delete" method="POST">
                  <input type="hidden" name="post_id" value={post.id} readOnly />
                  <input
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-full text-xs float-right hover:cursor-pointer"
                    value="Delete"
                    type="submit"
                  />
                </form>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<Posts></Posts>);
