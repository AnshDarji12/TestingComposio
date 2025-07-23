import streamlit as st
from composio import Composio

st.set_page_config(page_title="Composio Connect Example")

# Initialize Composio client
composio_api_key = st.text_input("Composio API Key", type="password")
user_id = st.text_input("User ID", value="user@example.com")
auth_config_id = st.text_input("Auth Config ID", value="ac_XXXXXX")
custom_redirect_url = "http://localhost:8501"  # Your Streamlit app URL

if composio_api_key and user_id and auth_config_id:
    composio = Composio(api_key=composio_api_key)

    # Step 1: Initiate connection and get redirect URL
    if st.button("Connect Gmail"):
        connection_request = composio.connected_accounts.initiate(
            user_id=user_id,
            auth_config_id=auth_config_id,
            config={"redirectUrl": custom_redirect_url}
        )
        st.session_state['connection_id'] = connection_request.id
        st.markdown(f"[Click here to authenticate Gmail]({connection_request.redirect_url})")

    # Step 2: After redirect, check connection status
    connection_id = st.session_state.get('connection_id')
    if connection_id and st.button("Check Connection Status"):
        connected_account = composio.connected_accounts.get(connection_id)
        if connected_account.status == "ACTIVE":
            st.success("✅ Gmail connected!")
        else:
            st.warning(f"Status: {connected_account.status}")

    # Optionally, auto-check on page load
    if st.session_state.get('connection_id'):
        connected_account = composio.connected_accounts.get(st.session_state['connection_id'])
        if connected_account.status == "ACTIVE":
            st.success("✅ Gmail connected!") 