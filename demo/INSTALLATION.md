# 📦 CloverShield Installation Guide

Complete installation instructions for all platforms.

---

## 📋 Prerequisites

### Required
- **Python**: 3.8 or higher
- **pip**: Python package manager
- **Internet connection**: For package installation

### Optional
- **Git**: For cloning repository
- **Docker**: For containerized deployment
- **Virtual environment**: Recommended for isolation

---

## 🖥️ Platform-Specific Installation

### Windows

#### Method 1: One-Click Launcher (Easiest)
1. Navigate to the `demo` folder
2. Double-click `run_demo.bat`
3. Wait for browser to open
4. Done! 🎉

#### Method 2: Command Line
```cmd
# Open PowerShell or Command Prompt
cd path\to\mrf\demo

# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run app.py
```

#### Method 3: Virtual Environment (Recommended)
```cmd
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run app.py
```

### Linux

#### Method 1: Quick Start Script
```bash
cd mrf/demo
chmod +x run_demo.sh
./run_demo.sh
```

#### Method 2: Manual Installation
```bash
cd mrf/demo

# Install dependencies
pip3 install -r requirements.txt

# Run the app
streamlit run app.py
```

#### Method 3: Virtual Environment (Recommended)
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run app.py
```

### macOS

#### Method 1: Quick Start Script
```bash
cd mrf/demo
chmod +x run_demo.sh
./run_demo.sh
```

#### Method 2: Using Homebrew
```bash
# Install Python (if not already installed)
brew install python@3.9

# Navigate to demo folder
cd mrf/demo

# Install dependencies
pip3 install -r requirements.txt

# Run the app
streamlit run app.py
```

#### Method 3: Virtual Environment (Recommended)
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run app.py
```

---

## 🐳 Docker Installation

### Using Docker Compose (Recommended)
```bash
cd mrf/demo
docker-compose up -d
```

Access at: `http://localhost:8501`

### Using Docker Directly
```bash
cd mrf/demo

# Build the image
docker build -t clovershield:latest .

# Run the container
docker run -p 8501:8501 clovershield:latest
```

### With ML Model
```bash
# Mount the Models directory
docker run -p 8501:8501 \
  -v $(pwd)/../Models:/app/Models:ro \
  clovershield:latest
```

---

## 📦 Dependency Installation

### Core Dependencies
```bash
pip install streamlit>=1.28.0
pip install pandas>=1.5.0
pip install numpy>=1.23.0
pip install plotly>=5.14.0
```

### Optional (for ML Model)
```bash
pip install scikit-learn>=1.2.0
pip install xgboost>=1.7.0
pip install shap>=0.42.0
pip install joblib>=1.2.0
pip install networkx>=3.0
```

### All at Once
```bash
pip install -r requirements.txt
```

---

## 🔧 Configuration

### Streamlit Configuration

The app uses custom configuration in `demo/.streamlit/config.toml`:

```toml
[theme]
primaryColor = "#00D9FF"
backgroundColor = "#0A0E27"
secondaryBackgroundColor = "#1A1F3A"
textColor = "#FFFFFF"
font = "sans serif"

[server]
headless = true
port = 8501
enableCORS = false
```

### Environment Variables (Optional)

Create a `.env` file in the `demo` folder:

```bash
# Model path (if different from default)
MODEL_PATH=/path/to/your/model.pkl

# Database connection (for production)
DATABASE_URL=postgresql://user:pass@localhost/dbname

# API keys (if using external services)
GROQ_API_KEY=your_api_key_here
```

---

## 🧪 Verify Installation

### Test 1: Check Python Version
```bash
python --version
# Should show: Python 3.8.x or higher
```

### Test 2: Check Dependencies
```bash
pip list | grep streamlit
pip list | grep pandas
pip list | grep plotly
```

### Test 3: Run the App
```bash
cd demo
streamlit run app.py
```

Expected output:
```
You can now view your Streamlit app in your browser.

Local URL: http://localhost:8501
Network URL: http://192.168.x.x:8501
```

### Test 4: Access the App
Open browser and go to: `http://localhost:8501`

You should see the CloverShield interface!

---

## 🐛 Troubleshooting

### Issue 1: "Python not found"

**Windows:**
```cmd
# Download and install Python from python.org
# Make sure to check "Add Python to PATH" during installation
```

**Linux:**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

**macOS:**
```bash
brew install python@3.9
```

### Issue 2: "pip not found"

```bash
# Windows
python -m ensurepip --upgrade

# Linux/Mac
python3 -m ensurepip --upgrade
```

### Issue 3: "Module not found" errors

```bash
# Reinstall all dependencies
pip install --upgrade -r requirements.txt

# Or install specific missing module
pip install streamlit
```

### Issue 4: "Port 8501 already in use"

**Option 1: Use different port**
```bash
streamlit run app.py --server.port=8502
```

**Option 2: Kill existing process**
```bash
# Windows
netstat -ano | findstr :8501
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8501 | xargs kill -9
```

### Issue 5: "Permission denied" (Linux/Mac)

```bash
# Make script executable
chmod +x run_demo.sh

# Or run with sudo
sudo ./run_demo.sh
```

### Issue 6: Slow installation

```bash
# Use a faster mirror
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# Or install without cache
pip install --no-cache-dir -r requirements.txt
```

### Issue 7: SSL Certificate errors

```bash
# Install certificates
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

### Issue 8: Virtual environment issues

```bash
# Deactivate current environment
deactivate

# Remove old environment
rm -rf venv

# Create fresh environment
python -m venv venv

# Activate and reinstall
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

---

## 🔄 Updating

### Update CloverShield
```bash
# Pull latest changes (if using Git)
git pull origin main

# Reinstall dependencies (in case of updates)
pip install --upgrade -r requirements.txt

# Run the app
streamlit run app.py
```

### Update Dependencies Only
```bash
pip install --upgrade streamlit pandas numpy plotly
```

---

## 🗑️ Uninstallation

### Remove Virtual Environment
```bash
# Deactivate if active
deactivate

# Remove directory
rm -rf venv
```

### Remove Global Packages
```bash
pip uninstall streamlit pandas numpy plotly -y
```

### Remove Docker Containers
```bash
docker-compose down
docker rmi clovershield:latest
```

---

## 📊 System Requirements

### Minimum
- **CPU**: 2 cores
- **RAM**: 2 GB
- **Storage**: 500 MB
- **OS**: Windows 10, Ubuntu 18.04, macOS 10.14

### Recommended
- **CPU**: 4+ cores
- **RAM**: 4+ GB
- **Storage**: 2+ GB
- **OS**: Windows 11, Ubuntu 22.04, macOS 12+

### For Production
- **CPU**: 8+ cores
- **RAM**: 16+ GB
- **Storage**: 10+ GB SSD
- **Network**: 100+ Mbps
- **OS**: Linux (Ubuntu 22.04 LTS recommended)

---

## 🌐 Network Configuration

### Firewall Rules
Allow incoming connections on port 8501:

**Windows:**
```cmd
netsh advfirewall firewall add rule name="Streamlit" dir=in action=allow protocol=TCP localport=8501
```

**Linux (ufw):**
```bash
sudo ufw allow 8501/tcp
```

**Linux (iptables):**
```bash
sudo iptables -A INPUT -p tcp --dport 8501 -j ACCEPT
```

### Access from Other Devices

By default, Streamlit binds to localhost. To allow external access:

```bash
streamlit run app.py --server.address=0.0.0.0
```

**Warning**: Only do this on trusted networks!

---

## 🔐 Security Considerations

### For Demo/Development
- Default settings are fine
- No sensitive data stored
- Local access only

### For Production
- Use HTTPS (reverse proxy with Nginx)
- Enable authentication
- Set up firewall rules
- Use environment variables for secrets
- Regular security updates

---

## 📞 Installation Support

**Still having issues?**

1. Check the [FAQ](demo/README.md#faq)
2. Search [GitHub Issues](https://github.com/yourrepo/issues)
3. Ask on [GitHub Discussions](https://github.com/yourrepo/discussions)
4. Email: @rahathasan452

**When reporting issues, include:**
- Operating system & version
- Python version (`python --version`)
- Error messages (full output)
- Steps to reproduce

---

## ✅ Installation Checklist

- [ ] Python 3.8+ installed
- [ ] pip working correctly
- [ ] Virtual environment created (optional but recommended)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Streamlit runs without errors
- [ ] Browser opens to `http://localhost:8501`
- [ ] CloverShield interface loads
- [ ] Can process test transaction
- [ ] Language toggle works (EN/BN)

---

**Congratulations! 🎉 CloverShield is now installed and ready to use!**

Next steps:
- Read [QUICKSTART.md](QUICKSTART.md) for demo scenarios
- Check [SHOWCASE.md](SHOWCASE.md) for presentation tips
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

---

Built with ❤️ by Team Clover Crew

