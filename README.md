# `react-datastore`

# WIP

Inspired by the [`isMounted` is an Anti-pattern](https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html) blog post, `react-datastore` is a generic data store that caches requests and respects React's Component Lifecycle by registering onto specific React Component Instances. With this handle, `react-datastore` can queue up requests, and cancel any that are still going over-the wire when your components are un-mounted (like on a route change).

## Usage

```bash
yarn add react-datastore
```

```jsx
import React from 'react';
import DataStore from 'react-datastore';

const ds = new DataStore({
  // Resolve the URL
  resolve: ({ path, query }) => {
    if (query) {
      return `${path}?query=${query}`;
    }

    return path;
  },
});

class MyComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      results: null,
    };
  }

  componentDidMount() {
    this._fetch = ds.subscribe(this);
    this._handleRequest({ path: '/resources' });
  }

  componentWillUnmount() {
    ds.unsubscribe(this);
    this._fetch = null;
  }

  render() {
    if (this.state.loading) {
      return <p>Loading...</p>;
    }

    return (
      <ul className="list">
        {results.map((result, i) => (
          <li key={i} className="item">{result}</li>
        ))}
      </ul>
    );
  }

  _handleRequest = ({ path }) => {
    this._fetch(path)
      .then((results) => this.setState({ results, loading: false }))
      .catch((error) => console.log(error));
  }
}
```
