I’m kicking off a new series I’m calling BNB: Bread n’ Butter 🍞🧈.
Why? Because no matter how many projects we ship, the fundamentals are always what keep us sharp.

After wrapping up my first term in a Master’s program, I finally had a Monday “off” — so I decided to step back and revisit the MERN stack basics. I’ve already shipped 2 live projects with it, but there’s always room to improve, right?!

So let’s start where it matters most: Frontend (React + Next.js).

---

# Frontend (React/Next.js)
> ***The things we touch all the time when building UIs:***

---

## 1. State ( useState, useReducer)
- Track what's changing on screen: form inputs, toggles, counters.
- Example:
```tsx
const [email, setEmail] = useState('');
```

![useState](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vw46iq56q5y8k1ze94ex.webp)

---

## 2. Effects (useEffect)
- Handle side effects: fetch data, subscribe to events, clean up
- Example: fetch API when component mounts
```tsx
useEffect(() => {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => setData(data));
}, []);
```

![useEffect](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/on25666w0o26gz4qqas0.webp)

---

## 3. Forms (useForm, controlled inputs)
- Manage form inputs and validation
- Example:
```tsx
const { register, handleSubmit, formState: { errors } } = useForm();
```

![useForm](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ojhtwsu7zutdwjwf6wwi.webp)

---

## 4. Routing/Pages (useRouter)
- File-based routing, dynamic params, API routes - Next.js makes it smooth.
- Example:
```tsx
const router = useRouter();
router.push('/about');
```

![useRouter](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/luw29mbejvw76dr2veue.webp)

---

## 5. Context/Props
- Pass data down components (props) or globally (context)
- Example:
```tsx
const { user } = useContext(AuthContext);
```

![useAuth](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dnw07eqdirgjz2i9ychl.webp)

## The Bread n’ Butter Flow:

State → Effect → Form → Routing → Props/Context

--- 

If you can confidently handle these, you’ve got the daily tools of a React/Next.js dev covered. Everything else is layering on top.

---

I dive into the backend side of MERN in the next post with **BNB: Node.js, Express, Apollo**

How about you, any personal “bread n’ butter” in frontend? Anything you can’t live without? Share with me, I'm curious!!